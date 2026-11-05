import type { CampaignBundle } from '../types'
import { renderMaster } from '../templates'
import type { OftImage } from './oft'

function fileBase(bundle: CampaignBundle): string {
  const raw = bundle.campaign.name || bundle.campaign.title || 'oft-template'
  return raw.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function download(filename: string, contents: BlobPart, type: string) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportHtml(bundle: CampaignBundle) {
  download(`${fileBase(bundle)}.html`, renderMaster(bundle), 'text/html;charset=utf-8')
}

/**
 * An unsent email draft (.eml) for Outlook for Mac, new Outlook, and other
 * desktop mail apps that cannot open .oft. Images travel inside the file as
 * inline parts, referenced from the HTML with cid: links, like the .oft.
 */
export function downloadEml(bundle: CampaignBundle): string {
  const { html, images } = embedImages(renderMaster(bundle))
  const subject = bundle.campaign.subject || bundle.campaign.title
  const altBoundary = `alt-${crypto.randomUUID()}`
  const relBoundary = `rel-${crypto.randomUUID()}`
  const encoder = new TextEncoder()

  const lines = [
    'MIME-Version: 1.0',
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Subject: ${encodeHeader(subject)}`,
    // Tells Outlook to open this as a draft you can edit and send.
    'X-Unsent: 1',
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(encoder.encode(htmlToReadableText(html))),
    `--${altBoundary}`,
    `Content-Type: multipart/related; boundary="${relBoundary}"; type="text/html"`,
    '',
    `--${relBoundary}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(encoder.encode(html)),
    ...images.flatMap((image) => [
      `--${relBoundary}`,
      `Content-Type: ${image.mime}; name="${image.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-ID: <${image.contentId}>`,
      `Content-Disposition: inline; filename="${image.filename}"`,
      '',
      base64Lines(image.bytes),
    ]),
    `--${relBoundary}--`,
    `--${altBoundary}--`,
    '',
  ]
  const filename = `${fileBase(bundle)}.eml`
  download(filename, lines.join('\r\n'), 'message/rfc822')
  return filename
}

/** RFC 2047 encoded-word so curly quotes and non-English subjects survive. */
function encodeHeader(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) return value
  return `=?UTF-8?B?${bytesToBase64(new TextEncoder().encode(value))}?=`
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/** Base64 wrapped at 76 characters, as mail requires. */
function base64Lines(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/.{76}/g, '$&\r\n').replace(/\r\n$/, '')
}

export function exportJson(bundle: CampaignBundle) {
  download(
    `${fileBase(bundle)}.json`,
    JSON.stringify(bundle, null, 2),
    'application/json',
  )
}

// A real Outlook template file. The file builder (and the small library it
// needs) loads only when someone clicks the button.
export async function downloadOft(bundle: CampaignBundle): Promise<string> {
  const [cfbModule, { buildOft }] = await Promise.all([import('cfb'), import('./oft')])
  // cfb is a CommonJS package; depending on the bundler it arrives as the
  // namespace itself or under `default`.
  const loose = cfbModule as unknown as { utils?: unknown; default?: unknown }
  const CFB = (loose.utils ? loose : loose.default) as typeof cfbModule
  const { html, images } = embedImages(renderMaster(bundle))
  const bytes = buildOft(CFB, {
    subject: bundle.campaign.subject || bundle.campaign.title,
    html,
    text: htmlToReadableText(html),
    images,
  })
  const filename = `${fileBase(bundle)}.oft`
  download(filename, bytes as Uint8Array<ArrayBuffer>, 'application/vnd.ms-outlook')
  return filename
}

/**
 * Moves every data: image in the email into an attachment and points the
 * HTML at it with a cid: link, the way Outlook stores pictures in a message.
 */
function embedImages(source: string): { html: string; images: OftImage[] } {
  const images: OftImage[] = []
  const seen = new Map<string, string>()
  const html = source.replace(
    /src="data:(image\/(png|jpeg|gif));base64,([A-Za-z0-9+/=]+)"/g,
    (_match, mime: string, kind: string, base64: string) => {
      let contentId = seen.get(base64)
      if (!contentId) {
        const number = String(images.length + 1).padStart(3, '0')
        contentId = `image${number}@oft-template-maker`
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
        images.push({
          contentId,
          filename: `image${number}.${kind === 'jpeg' ? 'jpg' : kind}`,
          mime,
          bytes,
        })
        seen.set(base64, contentId)
      }
      return `src="cid:${contentId}"`
    },
  )
  return { html, images }
}

/** Plain-text version of the email, keeping line and paragraph breaks. */
function htmlToReadableText(html: string): string {
  const marked = html.replace(/<(br|\/p|\/h[1-6]|\/li|\/tr|\/div)\b[^>]*>/gi, '$&\n')
  const doc = new DOMParser().parseFromString(marked, 'text/html')
  doc.querySelectorAll('style, title, script, head').forEach((node) => node.remove())
  return (doc.body.textContent || '')
    .split('\n')
    .map((line) => line.replace(/[\s\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Puts the rendered email on the clipboard as rich HTML (plus a plain-text
// fallback). Pasting into any compose box, including Outlook on the web,
// brings in the formatted email instead of raw markup or a plain file.
export async function copyForOutlook(bundle: CampaignBundle) {
  const html = renderMaster(bundle)
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    const plain = htmlToPlainText(html)
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ])
    return
  }
  // Older browsers without ClipboardItem support: fall back to plain text.
  await navigator.clipboard.writeText(htmlToPlainText(html))
}

function htmlToPlainText(html: string): string {
  const container = document.createElement('div')
  container.innerHTML = html
  return (container.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}
