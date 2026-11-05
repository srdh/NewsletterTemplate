import type { CampaignBundle } from '../types'
import { emailDocument, escapeHtml, msSquares, sectionAttr } from '../lib/html'
import { readDesign, readableOn, type BodyBlock, type InnerBlock, type NewsletterDesign } from '../lib/newsletter'
import { emailRichHtml, isRichEmpty, type RichTextLook } from '../lib/richText'

import { fontStack } from '../lib/fonts'

/**
 * The email's font stack. Set from the design at the start of each render
 * (rendering is synchronous, so one render never sees another's font).
 */
let FONT = fontStack('Segoe UI')
const INK = '#242424'
/** Left and right padding of the email body. */
const GUTTER = 32
/** Inner padding of a card. */
const CARD_PAD = 24

/**
 * Bulletproof button: a table cell carries the colour so Outlook's Word
 * engine (which ignores padding on links) still shows a solid button.
 */
function button(label: string, url: string, background: string, align: string): string {
  const color = readableOn(background)
  const safeUrl = escapeHtml(url || '#')
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="border-collapse:separate;${align === 'center' ? 'margin:0 auto;' : ''}">
    <tr>
      <td align="center" bgcolor="${background}" style="background:${background};border-radius:4px;mso-padding-alt:10px 22px;">
        <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:10px 22px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:${color};text-decoration:none;border-radius:4px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`
}

/** Microsoft four-square mark with the wordmark, or an uploaded logo. */
function logoHtml(logo: string, showMark: boolean, color: string, size: 'banner' | 'footer'): string {
  if (logo) {
    const height = size === 'banner' ? 30 : 18
    return `<img src="${escapeHtml(logo)}" alt="Microsoft" height="${height}" style="display:block;height:${height}px;width:auto;border:0;">`
  }
  if (!showMark) return ''
  if (size === 'banner') return msSquares(11, 2)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td valign="middle">${msSquares(9, 2)}</td><td valign="middle" style="padding-left:8px;font-family:${FONT};font-size:14px;font-weight:600;color:${color};">Microsoft</td></tr></table>`
}

function bannerHtml(bundle: CampaignBundle, design: NewsletterDesign, preview: boolean): string {
  const c = bundle.campaign
  const b = design.banner
  const width = design.style.width
  const align = b.align
  const logo = logoHtml(b.logo, b.showMark, b.text, 'banner')
  const markRow =
    logo || b.dateLabel
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
          <tr>
            <td valign="middle" align="left">${logo}</td>
            <td valign="middle" align="right" style="font-family:${FONT};font-size:12px;line-height:16px;color:${b.text};">${escapeHtml(b.dateLabel)}</td>
          </tr>
        </table>`
      : ''
  const words = `
    ${c.kicker ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${b.text};text-align:${align};">${escapeHtml(c.kicker)}</p>` : ''}
    ${c.title ? `<h1 style="margin:0;font-family:${FONT};font-size:30px;line-height:36px;font-weight:700;color:${b.text};text-align:${align};">${escapeHtml(c.title)}</h1>` : ''}
    ${c.subtitle ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:16px;line-height:22px;color:${b.text};opacity:0.9;text-align:${align};">${escapeHtml(c.subtitle)}</p>` : ''}
    ${c.register_label && c.register_url ? `<div style="margin:20px 0 0;text-align:${align};">${button(c.register_label, c.register_url, b.text === '#FFFFFF' ? '#FFFFFF' : design.style.accent, align)}</div>` : ''}`

  const image = c.banner_image
  if (b.layout === 'image' && image) {
    const hasWords = Boolean(c.kicker || c.title || c.subtitle || (c.register_label && c.register_url))
    // The logo row sits on the email body colour above the picture.
    const logoRow = logo || b.dateLabel
      ? `<tr${sectionAttr(preview, 'banner')}>
      <td bgcolor="${design.style.paper}" style="background:${design.style.paper};padding:20px ${GUTTER}px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" align="left">${logoHtml(b.logo, b.showMark, INK, 'banner')}</td>
            <td valign="middle" align="right" style="font-family:${FONT};font-size:12px;line-height:16px;color:#616161;">${escapeHtml(b.dateLabel)}</td>
          </tr>
        </table>
      </td>
    </tr>`
      : ''
    return `${logoRow}<tr${sectionAttr(preview, 'banner')}>
      <td style="padding:0;">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(b.imageAlt || c.title || c.subject)}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;">
      </td>
    </tr>
    ${
      hasWords
        ? `<tr${sectionAttr(preview, 'banner')}>
      <td bgcolor="${b.background}" style="background:${b.background};padding:24px ${GUTTER}px 28px;">${words}</td>
    </tr>`
        : ''
    }`
  }

  if (b.layout === 'split' && image) {
    return `<tr${sectionAttr(preview, 'banner')}>
      <td bgcolor="${b.background}" style="background:${b.background};padding:28px ${GUTTER}px;">
        ${markRow}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" style="padding-right:20px;">${words}</td>
            <td valign="middle" width="200" align="right"><img src="${escapeHtml(image)}" alt="" width="200" style="display:block;width:200px;max-width:200px;height:auto;border:0;"></td>
          </tr>
        </table>
      </td>
    </tr>`
  }

  return `<tr${sectionAttr(preview, 'banner')}>
    <td bgcolor="${b.background}" style="background:${b.background};padding:28px ${GUTTER}px 32px;">
      ${markRow}
      ${words}
    </td>
  </tr>`
}

/** One block's content, without the row around it. `width` is the space it has. */
function innerHtml(block: InnerBlock, design: NewsletterDesign, width: number, look: RichTextLook): string {
  const accent = design.style.accent
  switch (block.kind) {
    case 'text':
      return isRichEmpty(block.html) ? '' : emailRichHtml(block.html, look)
    case 'callout': {
      if (isRichEmpty(block.html)) return ''
      const rule = block.rule || accent
      const ink = block.text || (readableOn(block.background) === '#FFFFFF' ? '#FFFFFF' : INK)
      const calloutLook: RichTextLook = { ...look, color: ink, accent: block.text || look.accent }
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${block.showRule ? `<td width="4" bgcolor="${rule}" style="background:${rule};font-size:0;line-height:0;">&nbsp;</td>` : ''}
          <td bgcolor="${block.background}" style="background:${block.background};padding:16px 20px;color:${ink};">${emailRichHtml(block.html, calloutLook)}</td>
        </tr>
      </table>`
    }
    case 'image': {
      if (!block.src) return ''
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;">`
      const linked = block.href ? `<a href="${escapeHtml(block.href)}" target="_blank" style="text-decoration:none;">${img}</a>` : img
      const caption = block.caption
        ? `<p style="margin:8px 0 0;font-family:${FONT};font-size:12px;line-height:16px;color:#616161;">${escapeHtml(block.caption)}</p>`
        : ''
      return linked + caption
    }
    case 'button':
      if (!block.label.trim()) return ''
      return `<div style="text-align:${block.align};padding-top:4px;">${button(block.label, block.url, block.color || accent, block.align)}</div>`
    case 'divider':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" bgcolor="#E0E0E0" style="background:#E0E0E0;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
  }
}

function blockRow(block: BodyBlock, design: NewsletterDesign, preview: boolean): string {
  const width = design.style.width - GUTTER * 2
  const look: RichTextLook = { font: FONT, color: INK, link: design.style.link, accent: design.style.accent, size: design.style.size }
  const row = (inner: string, padding = `0 ${GUTTER}px 20px`) =>
    inner ? `<tr${sectionAttr(preview, 'body')}><td style="padding:${padding};font-family:${FONT};">${inner}</td></tr>` : ''

  switch (block.kind) {
    case 'card': {
      const innerWidth = width - CARD_PAD * 2
      const items = block.items
        .map((item) => innerHtml(item, design, innerWidth, look))
        .filter(Boolean)
        .map((html, index, all) => `<tr><td style="padding:0 0 ${index === all.length - 1 ? 0 : 16}px;font-family:${FONT};">${html}</td></tr>`)
        .join('')
      if (!items) return ''
      const border = block.border ? `border:2px solid ${block.border};` : ''
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${block.background}" style="background:${block.background};${border}border-collapse:separate;">
          <tr><td style="padding:${CARD_PAD}px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items}</table>
          </td></tr>
        </table>`,
        `4px ${GUTTER}px 24px`,
      )
    }
    case 'media': {
      if (!block.src && isRichEmpty(block.html)) return ''
      const border = block.border ? `border:1px solid ${block.border};` : ''
      const picture = block.src
        ? `<td valign="middle" width="${block.imageWidth}" style="width:${block.imageWidth}px;padding:12px 0 12px 12px;"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="${block.imageWidth}" style="display:block;width:${block.imageWidth}px;height:auto;border:0;"></td>`
        : ''
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${block.background}" style="background:${block.background};${border}border-collapse:separate;">
          <tr>
            ${picture}
            <td valign="middle" style="padding:16px 20px;font-family:${FONT};">${emailRichHtml(block.html, { ...look, color: readableOn(block.background) === '#FFFFFF' ? '#FFFFFF' : INK })}</td>
          </tr>
        </table>`,
        `0 ${GUTTER}px 16px`,
      )
    }
    case 'section': {
      if (isRichEmpty(block.html)) return ''
      const sectionLook: RichTextLook = { font: FONT, color: block.text, link: block.link, accent: block.text, size: design.style.size }
      return `<tr${sectionAttr(preview, 'body')}>
        <td bgcolor="${block.background}" style="background:${block.background};padding:28px ${GUTTER}px;font-family:${FONT};color:${block.text};">${emailRichHtml(block.html, sectionLook)}</td>
      </tr>`
    }
    case 'button':
      return row(innerHtml(block, design, width, look), `0 ${GUTTER}px 24px`)
    case 'divider':
      return row(innerHtml(block, design, width, look), `4px ${GUTTER}px 24px`)
    default:
      return row(innerHtml(block, design, width, look))
  }
}

function footerHtml(design: NewsletterDesign, preview: boolean): string {
  const f = design.footer
  const look = { font: FONT, color: f.text, link: f.text, accent: f.text, size: 13 }
  const message = isRichEmpty(f.html) ? '' : `<div style="margin:0 0 14px;">${emailRichHtml(f.html, look)}</div>`
  const links = f.links
    .filter((link) => link.label.trim())
    .map((link) =>
      link.url
        ? `<a href="${escapeHtml(link.url)}" target="_blank" style="color:${f.text};text-decoration:underline;">${escapeHtml(link.label)}</a>`
        : escapeHtml(link.label),
    )
    .join(`<span style="color:${f.text};opacity:0.6;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`)
  const legal = f.legal
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join('<br>')
  const logo = logoHtml(f.logo, f.showMark, f.text, 'footer')

  return `<tr${sectionAttr(preview, 'footer')}>
    <td bgcolor="${f.background}" style="background:${f.background};padding:28px ${GUTTER}px;font-family:${FONT};color:${f.text};">
      ${message}
      ${links ? `<p style="margin:0 0 14px;font-family:${FONT};font-size:12px;line-height:18px;color:${f.text};">${links}</p>` : ''}
      ${logo ? `<div style="margin:0 0 12px;">${logo}</div>` : ''}
      ${legal ? `<p style="margin:0;font-family:${FONT};font-size:11px;line-height:16px;color:${f.text};opacity:0.85;">${legal}</p>` : ''}
    </td>
  </tr>`
}

export function renderNewsletter(bundle: CampaignBundle, preview = false): string {
  const design = readDesign(bundle.campaign)
  FONT = fontStack(design.style.font)
  const { width, paper, canvas } = design.style
  const body = design.blocks.map((block) => blockRow(block, design, preview)).join('')
  // A section band as the last block runs straight into the footer.
  const last = design.blocks[design.blocks.length - 1]
  const endsWithBand = last?.kind === 'section' && !isRichEmpty(last.html)

  const inner = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${canvas}" style="background:${canvas};">
    <tr>
      <td align="center" style="padding:0;">
        <!--[if mso]><table role="presentation" width="${width}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="${width}" cellpadding="0" cellspacing="0" border="0" bgcolor="${paper}" style="width:${width}px;max-width:${width}px;background:${paper};font-family:${FONT};">
          ${bannerHtml(bundle, design, preview)}
          <tr><td height="28" style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
          ${body}
          ${endsWithBand ? '' : '<tr><td height="12" style="height:12px;font-size:0;line-height:0;">&nbsp;</td></tr>'}
          ${footerHtml(design, preview)}
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>`

  return emailDocument(bundle.campaign.subject || bundle.campaign.title, inner)
}
