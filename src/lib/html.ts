const LINK = '#0067C0'

/**
 * Marks an email block with the form section that edits it. Only the live
 * preview asks for these; downloads and copies are built without them.
 */
export function sectionAttr(preview: boolean, anchor: string): string {
  return preview ? ` data-section="${anchor}"` : ''
}

/** Wraps a run of email content in a marked block (preview only). */
export function markedBlock(preview: boolean, anchor: string, html: string): string {
  return preview && html ? `<div data-section="${anchor}">${html}</div>` : html
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function richHtml(value: string): string {
  const linked = escapeHtml(value).replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    `<a href="$2" style="color:${LINK};text-decoration:underline;">$1</a>`,
  )
  return linked
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n')
      const isList = lines.every((line) => line.trim() === '' || line.trim().startsWith('- '))
      if (isList) {
        const items = lines
          .map((line) => line.trim().replace(/^- /, ''))
          .filter(Boolean)
          .map(
            (item) =>
              `<li style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#242424;">${item}</li>`,
          )
          .join('')
        return `<ul style="margin:0 0 14px;padding:0 0 0 20px;">${items}</ul>`
      }
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#242424;">${lines.join('<br>')}</p>`
    })
    .join('')
}

export function linkHtml(label: string, href: string): string {
  if (!href) return escapeHtml(label)
  return `<a href="${escapeHtml(href)}" style="color:${LINK};text-decoration:underline;">${escapeHtml(label)}</a>`
}

export const GLOBE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="148" viewBox="0 0 168 148" aria-hidden="true">
  <defs>
    <linearGradient id="g" x1="20" y1="10" x2="150" y2="140" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7ED3B2"/>
      <stop offset="1" stop-color="#1B7A5A"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke="url(#g)" stroke-width="1.4">
    <ellipse cx="92" cy="74" rx="58" ry="58"/>
    <ellipse cx="92" cy="74" rx="38" ry="58"/>
    <ellipse cx="92" cy="74" rx="18" ry="58"/>
    <path d="M34 74h116M40 48h104M40 100h104M56 26c28 10 52 10 80 0M56 122c28-10 52-10 80 0"/>
    <path d="M118 18c22 18 34 40 34 56 0 28-18 52-42 64"/>
    <path d="M70 16c-26 14-42 38-42 58 0 22 12 44 32 58"/>
  </g>
</svg>`

export function msSquares(size = 11, gap = 2): string {
  const s = size
  const g = gap
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td width="${s}" height="${s}" bgcolor="#F25022" style="font-size:0;line-height:0;">&nbsp;</td>
      <td width="${g}" style="font-size:0;line-height:0;">&nbsp;</td>
      <td width="${s}" height="${s}" bgcolor="#7FBA00" style="font-size:0;line-height:0;">&nbsp;</td>
    </tr>
    <tr><td height="${g}" colspan="3" style="font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr>
      <td width="${s}" height="${s}" bgcolor="#00A4EF" style="font-size:0;line-height:0;">&nbsp;</td>
      <td width="${g}" style="font-size:0;line-height:0;">&nbsp;</td>
      <td width="${s}" height="${s}" bgcolor="#FFB900" style="font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>`
}

export function emailDocument(title: string, inner: string, lang = 'en-US'): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  ${inner}
</body>
</html>`
}
