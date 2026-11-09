import type { CampaignBundle } from '../types'
import { usesBlockList } from '../types'
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

/** The right side of the logo row: a partner logo, or the date label. */
function rightOfLogoRow(b: NewsletterDesign['banner'], color: string): string {
  if (b.rightLogo) {
    return `<img src="${escapeHtml(b.rightLogo)}" alt="" height="30" style="display:inline-block;height:30px;width:auto;border:0;">`
  }
  return `<span style="font-family:${FONT};font-size:12px;line-height:16px;color:${color};">${escapeHtml(b.dateLabel)}</span>`
}

function bannerHtml(bundle: CampaignBundle, design: NewsletterDesign, preview: boolean): string {
  const c = bundle.campaign
  const b = design.banner
  const width = design.style.width
  const align = b.align
  const logo = logoHtml(b.logo, b.showMark, b.text, 'banner')
  const markRow =
    logo || b.dateLabel || b.rightLogo
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
          <tr>
            <td valign="middle" align="left">${logo}</td>
            <td valign="middle" align="right">${rightOfLogoRow(b, b.text)}</td>
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
    const logoRow = logo || b.dateLabel || b.rightLogo
      ? `<tr${sectionAttr(preview, 'banner')}>
      <td bgcolor="${design.style.paper}" style="background:${design.style.paper};padding:20px ${GUTTER}px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" align="left">${logoHtml(b.logo, b.showMark, INK, 'banner')}</td>
            <td valign="middle" align="right">${rightOfLogoRow(b, '#616161')}</td>
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
      const boxBorder = block.border ? `border:1px solid ${block.border};border-collapse:separate;` : ''
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${boxBorder}">
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

/**
 * Where a click on a block in the preview goes. Custom opens the Body
 * section; Custom 2 opens that block (anchor "block:<id>").
 */
let blockAnchor: (block: BodyBlock) => string = () => 'body'

function blockRow(block: BodyBlock, design: NewsletterDesign, preview: boolean): string {
  const width = design.style.width - GUTTER * 2
  const look: RichTextLook = { font: FONT, color: INK, link: design.style.link, accent: design.style.accent, size: design.style.size }
  const anchor = blockAnchor(block)
  const row = (inner: string, padding = `0 ${GUTTER}px 20px`) =>
    inner ? `<tr${sectionAttr(preview, anchor)}><td style="padding:${padding};font-family:${FONT};">${inner}</td></tr>` : ''

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
      return `<tr${sectionAttr(preview, anchor)}>
        <td bgcolor="${block.background}" style="background:${block.background};padding:28px ${GUTTER}px;font-family:${FONT};color:${block.text};">${emailRichHtml(block.html, sectionLook)}</td>
      </tr>`
    }
    case 'button':
      return row(innerHtml(block, design, width, look), `0 ${GUTTER}px 24px`)
    case 'divider':
      return row(innerHtml(block, design, width, look), `4px ${GUTTER}px 24px`)
    case 'event':
      return row(eventHtml(block, design, look), `4px ${GUTTER}px 24px`)
    case 'table':
      return row(tableHtml(block, design), `0 ${GUTTER}px 24px`)
    case 'spotlights':
      return row(spotlightsHtml(block, design, width, look), `4px ${GUTTER}px 24px`)
    case 'signature':
      return row(signatureHtml(block, design), `4px ${GUTTER}px 24px`)
    case 'heading':
      return row(headingHtml(block, design), `8px ${GUTTER}px 16px`)
    case 'stats':
      return row(statsHtml(block, design), `0 ${GUTTER}px 20px`)
    case 'columns':
      return row(columnsHtml(block, design, width, look), `0 ${GUTTER}px 20px`)
    case 'gallery':
      return row(galleryHtml(block, width), `0 ${GUTTER}px 20px`)
    case 'people':
      return row(peopleHtml(block, design, width), `0 ${GUTTER}px 20px`)
    case 'details':
      return row(detailsHtml(block, design), `0 ${GUTTER}px 20px`)
    default:
      return row(innerHtml(block, design, width, look))
  }
}

type Block<K extends BodyBlock['kind']> = Extract<BodyBlock, { kind: K }>

function eventHtml(block: Block<'event'>, design: NewsletterDesign, look: RichTextLook): string {
  const accent = block.accent || design.style.accent
  const details = (
    [
      ['Date', block.date],
      ['Time', block.time],
      ['Where', block.location],
    ] as const
  )
    .filter(([, value]) => value.trim())
    .map(
      ([label, value]) => `<tr>
        <td valign="top" width="72" style="width:72px;padding:3px 12px 3px 0;font-family:${FONT};font-size:12px;line-height:20px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#616161;">${label}</td>
        <td valign="top" style="padding:3px 0;font-family:${FONT};font-size:${design.style.size}px;line-height:20px;font-weight:600;color:${INK};">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join('')
  if (!block.title.trim() && !details && isRichEmpty(block.html)) return ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${block.background}" style="background:${block.background};border-collapse:separate;">
    <tr>
      <td width="4" bgcolor="${accent}" style="background:${accent};font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:22px 24px;font-family:${FONT};">
        ${block.title.trim() ? `<p style="margin:0 0 12px;font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;color:${accent};">${escapeHtml(block.title)}</p>` : ''}
        ${details ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;">${details}</table>` : ''}
        ${isRichEmpty(block.html) ? '' : `<div style="margin:0 0 4px;">${emailRichHtml(block.html, look)}</div>`}
        ${block.buttonLabel.trim() && block.buttonUrl.trim() ? `<div style="padding-top:12px;">${button(block.buttonLabel, block.buttonUrl, accent, 'left')}</div>` : ''}
      </td>
    </tr>
  </table>`
}

function tableHtml(block: Block<'table'>, design: NewsletterDesign): string {
  const rows = block.rows.filter((row) => row.some((cell) => cell.trim()))
  if (!rows.length) return ''
  const size = Math.max(12, design.style.size - 1)
  const cell = (value: string, header: boolean, shade: string) =>
    `<${header ? 'th' : 'td'} align="left" valign="top" bgcolor="${shade}" style="background:${shade};padding:9px 12px;border:1px solid ${block.border};font-family:${FONT};font-size:${size}px;line-height:20px;text-align:left;${header ? `font-weight:600;color:${block.headerText};` : `color:${INK};`}">${escapeHtml(value) || '&nbsp;'}</${header ? 'th' : 'td'}>`
  const body = rows
    .map((row, index) => {
      const header = block.header && index === 0
      const dataIndex = block.header ? index - 1 : index
      const shade = header ? block.headerBackground : block.striped && dataIndex % 2 === 1 ? '#F5F5F5' : '#FFFFFF'
      return `<tr>${row.map((value) => cell(value, header, shade)).join('')}</tr>`
    })
    .join('')
  const title = block.title.trim()
    ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:17px;line-height:22px;font-weight:600;color:${INK};">${escapeHtml(block.title)}</p>`
    : ''
  return `${title}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${body}</table>`
}

function spotlightsHtml(block: Block<'spotlights'>, design: NewsletterDesign, width: number, look: RichTextLook): string {
  const cards = block.cards.filter((card) => card.title.trim() || card.image || !isRichEmpty(card.html))
  if (!cards.length) return ''
  const gap = 16
  const columnWidth = Math.floor((width - gap * (cards.length - 1)) / cards.length)
  const border = block.border ? `border:1px solid ${block.border};` : ''
  const columns = cards
    .map((card, index) => {
      const image = card.image
        ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)}" width="${columnWidth}" style="display:block;width:100%;max-width:${columnWidth}px;height:auto;border:0;">`
        : ''
      const link =
        card.linkLabel.trim() && card.linkUrl.trim()
          ? `<p style="margin:12px 0 0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;"><a href="${escapeHtml(card.linkUrl)}" target="_blank" style="color:${design.style.link};text-decoration:none;">${escapeHtml(card.linkLabel)} &rsaquo;</a></p>`
          : ''
      return `<td valign="top" width="${columnWidth}" style="width:${columnWidth}px;${index ? `padding-left:${gap}px;` : ''}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${block.background}" style="background:${block.background};${border}border-collapse:separate;">
          ${image ? `<tr><td style="padding:0;">${image}</td></tr>` : ''}
          <tr><td style="padding:16px 18px 18px;font-family:${FONT};">
            ${card.title.trim() ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:700;color:${INK};">${escapeHtml(card.title)}</p>` : ''}
            ${isRichEmpty(card.html) ? '' : emailRichHtml(card.html, { ...look, size: Math.max(12, design.style.size - 1) })}
            ${link}
          </td></tr>
        </table>
      </td>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${columns}</tr></table>`
}

function headingHtml(block: Block<'heading'>, design: NewsletterDesign): string {
  if (!block.title.trim()) return ''
  const lineHeight = Math.round(block.size * 1.3)
  // Filled bar or outlined pill: a table cell carries the shape for Outlook.
  if (block.fill || block.outline) {
    const fill = block.fill || design.style.paper
    const color = block.color || (block.fill ? readableOn(block.fill) : design.style.accent)
    const border = block.outline ? `border:1.5px solid ${block.outline};` : ''
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
      <tr><td bgcolor="${fill}" style="background:${fill};${border}border-radius:0 22px 22px 0;padding:8px 18px;font-family:${FONT};font-size:${block.size}px;line-height:${lineHeight}px;font-weight:700;color:${color};">${escapeHtml(block.title)}</td></tr>
    </table>`
  }
  const color = block.color || design.style.accent
  const rule = block.rule ? `border-bottom:2px solid ${block.rule};padding-bottom:8px;` : ''
  return `<p style="margin:0;font-family:${FONT};font-size:${block.size}px;line-height:${Math.round(block.size * 1.3)}px;font-weight:700;color:${color};${rule}">${escapeHtml(block.title)}</p>`
}

function statsHtml(block: Block<'stats'>, design: NewsletterDesign): string {
  const tiles = block.tiles.filter((tile) => tile.value.trim() || tile.label.trim())
  if (!tiles.length && !block.leadTitle.trim()) return ''
  const count = tiles.length + (block.leadTitle.trim() ? 1 : 0)
  const share = Math.floor(100 / Math.max(1, count))
  const lead = block.leadTitle.trim()
    ? `<td valign="middle" width="${share}%" bgcolor="${block.leadBackground}" style="background:${block.leadBackground};padding:12px 12px;border:2px solid ${design.style.paper};font-family:${FONT};">
        <p style="margin:0;font-family:${FONT};font-size:20px;line-height:24px;color:${readableOn(block.leadBackground)};">${escapeHtml(block.leadTitle)}</p>
        ${block.leadCaption.trim() ? `<p style="margin:2px 0 0;font-family:${FONT};font-size:11px;line-height:14px;font-weight:700;color:${readableOn(block.leadBackground)};">${escapeHtml(block.leadCaption)}</p>` : ''}
      </td>`
    : ''
  const cells = tiles
    .map(
      (tile) => `<td valign="top" width="${share}%" bgcolor="${tile.background}" style="background:${tile.background};padding:10px 10px 12px;border:2px solid ${design.style.paper};font-family:${FONT};">
        <p style="margin:0;font-family:${FONT};font-size:${count > 6 ? 24 : 28}px;line-height:32px;font-weight:400;color:${tile.text};">${escapeHtml(tile.value)}</p>
        <p style="margin:2px 0 0;font-family:${FONT};font-size:12px;line-height:16px;color:${tile.text};">${escapeHtml(tile.label)}</p>
      </td>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;table-layout:fixed;"><tr>${lead}${cells}</tr></table>`
}

function columnsHtml(block: Block<'columns'>, design: NewsletterDesign, width: number, look: RichTextLook): string {
  const columns = block.columns.filter((column) => column.title.trim() || !isRichEmpty(column.html))
  if (!columns.length) return ''
  const gap = 14
  const columnWidth = Math.floor((width - gap * (columns.length - 1)) / columns.length)
  const size = Math.max(12, design.style.size - 1)
  const cells = columns
    .map((column, index) => {
      const header = column.title.trim()
        ? column.headerBackground
          ? `<p style="margin:0 0 8px;padding:5px 8px;background:${column.headerBackground};font-family:${FONT};font-size:${size}px;line-height:20px;font-weight:700;color:${column.headerText};">${escapeHtml(column.title)}</p>`
          : `<p style="margin:0 0 6px;font-family:${FONT};font-size:${size + 1}px;line-height:22px;font-weight:700;color:${column.headerText};">${escapeHtml(column.title)}</p>`
        : ''
      return `<td valign="top" width="${columnWidth}" style="width:${columnWidth}px;${index ? `padding-left:${gap}px;` : ''}font-family:${FONT};">${header}${isRichEmpty(column.html) ? '' : emailRichHtml(column.html, { ...look, size })}</td>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>`
}

function galleryHtml(block: Block<'gallery'>, width: number): string {
  const images = block.images.filter((image) => image.src)
  if (!images.length) return ''
  const gap = 8
  const perRow = block.columns
  const cellWidth = Math.floor((width - gap * (perRow - 1)) / perRow)
  const rows: string[] = []
  for (let i = 0; i < images.length; i += perRow) {
    const cells = images
      .slice(i, i + perRow)
      .map(
        (image, index) =>
          `<td valign="top" width="${cellWidth}" style="width:${cellWidth}px;${index ? `padding-left:${gap}px;` : ''}padding-bottom:${gap}px;"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" width="${cellWidth}" style="display:block;width:100%;max-width:${cellWidth}px;height:auto;border:0;"></td>`,
      )
      .join('')
    rows.push(`<tr>${cells}</tr>`)
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>`
}

function peopleHtml(block: Block<'people'>, design: NewsletterDesign, width: number): string {
  const people = block.people.filter((person) => person.name.trim() || person.photo)
  if (!people.length) return ''
  const perRow = block.columns
  const cellWidth = Math.floor(width / perRow)
  const rows: string[] = []
  for (let i = 0; i < people.length; i += perRow) {
    const cells = people
      .slice(i, i + perRow)
      .map((person) => {
        const photo = person.photo
          ? `<img src="${escapeHtml(person.photo)}" alt="${escapeHtml(person.name)}" width="48" height="48" style="display:block;width:48px;height:48px;border:0;border-radius:24px;">`
          : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="48" height="48" align="center" bgcolor="#E2EFD9" style="width:48px;height:48px;background:#E2EFD9;border-radius:24px;font-family:${FONT};font-size:16px;font-weight:700;color:${design.style.accent};">${escapeHtml(initials(person.name))}</td></tr></table>`
        return `<td valign="top" width="${cellWidth}" style="width:${cellWidth}px;padding:8px 8px 8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top" width="48" style="width:48px;padding-right:10px;">${photo}</td>
            <td valign="top" style="font-family:${FONT};">
              <p style="margin:0;font-family:${FONT};font-size:13px;line-height:17px;color:${design.style.accent};">${escapeHtml(person.name)}</p>
              ${person.role.trim() ? `<p style="margin:0;font-family:${FONT};font-size:11px;line-height:15px;color:${design.style.accent};">${escapeHtml(person.role)}</p>` : ''}
              ${person.detail.trim() ? `<p style="margin:0;font-family:${FONT};font-size:11px;line-height:15px;color:#404040;">${escapeHtml(person.detail)}</p>` : ''}
            </td>
          </tr></table>
        </td>`
      })
      .join('')
    rows.push(`<tr>${cells}</tr>`)
  }
  const title = block.title.trim()
    ? `<p style="margin:0 0 4px;padding:4px 8px;${block.headerBackground ? `background:${block.headerBackground};` : ''}font-family:${FONT};font-size:14px;line-height:20px;color:${INK};">${escapeHtml(block.title)}</p>`
    : ''
  return `${title}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">${rows.join('')}</table>`
}

function initials(name: string): string {
  const words = name.replace(/[[\]]/g, '').trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase()
}

/** Plain value, or a link when it is an email address or web address. */
function detailValue(value: string, link: string): string {
  const v = value.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `<a href="mailto:${escapeHtml(v)}" style="color:${link};text-decoration:underline;">${escapeHtml(v)}</a>`
  if (/^https?:\/\//i.test(v)) return `<a href="${escapeHtml(v)}" target="_blank" style="color:${link};text-decoration:underline;">${escapeHtml(v)}</a>`
  return escapeHtml(v)
}

function detailsHtml(block: Block<'details'>, design: NewsletterDesign): string {
  const rows = block.rows.filter((row) => row.label.trim() || row.value.trim())
  if (!rows.length && !block.title.trim()) return ''
  const accent = block.accent || design.style.link
  const size = design.style.size
  const body = rows
    .map(
      (row) => `<tr>
        <td valign="top" width="110" style="width:110px;padding:5px 8px 5px 0;font-family:${FONT};font-size:${size - 1}px;line-height:20px;font-weight:700;color:${block.labelColor};">${escapeHtml(row.label)}</td>
        <td valign="top" width="14" style="width:14px;padding:5px 8px 5px 0;font-family:${FONT};font-size:${size - 1}px;line-height:20px;color:${INK};">:</td>
        <td valign="top" style="padding:5px 0;font-family:${FONT};font-size:${size - 1}px;line-height:20px;color:${INK};${row.strong ? 'font-weight:700;' : ''}">${detailValue(row.value, design.style.link)}${row.note.trim() ? ` <span style="font-size:12px;font-weight:400;color:#616161;">${escapeHtml(row.note)}</span>` : ''}</td>
      </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${block.background}" style="background:${block.background};border-collapse:separate;">
    <tr>
      <td width="4" bgcolor="${accent}" style="background:${accent};font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:0;">
        ${block.title.trim() ? `<p style="margin:0;padding:6px 16px;background:#F3F8FC;font-family:${FONT};font-size:${size}px;line-height:22px;font-weight:700;color:${design.style.accent};">${escapeHtml(block.title)}</p>` : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 8px;"><tr><td style="padding:0 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">${body}</table>
        </td></tr></table>
      </td>
    </tr>
  </table>`
}

function signatureHtml(block: Block<'signature'>, design: NewsletterDesign): string {
  if (!block.name.trim() && !block.signoff.trim()) return ''
  const line = (value: string, style: string) =>
    value.trim() ? `<p style="margin:0;font-family:${FONT};${style}">${escapeHtml(value)}</p>` : ''
  const words = `
    ${line(block.signoff, `font-size:${design.style.size}px;line-height:22px;color:${INK};margin-bottom:10px;`)}
    ${line(block.name, `font-size:${design.style.size + 1}px;line-height:22px;font-weight:700;color:${INK};`)}
    ${line(block.role, 'font-size:13px;line-height:18px;color:#616161;')}
    ${line(block.team, `font-size:13px;line-height:18px;font-weight:600;color:${design.style.accent};`)}
    ${block.email.trim() ? `<p style="margin:4px 0 0;font-family:${FONT};font-size:13px;line-height:18px;"><a href="mailto:${escapeHtml(block.email)}" style="color:${design.style.link};text-decoration:underline;">${escapeHtml(block.email)}</a></p>` : ''}`
  if (!block.photo) return words
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="top" width="64" style="width:64px;padding-right:14px;"><img src="${escapeHtml(block.photo)}" alt="${escapeHtml(block.name)}" width="64" height="64" style="display:block;width:64px;height:64px;border:0;border-radius:32px;"></td>
    <td valign="top">${words}</td>
  </tr></table>`
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
  blockAnchor = usesBlockList(bundle.campaign.master_type) ? (block) => `block:${block.id}` : () => 'body'
  const { width, paper, canvas, frame } = design.style
  const body = design.blocks.map((block) => blockRow(block, design, preview)).join('')
  // A section band as the last block runs straight into the footer.
  const last = design.blocks[design.blocks.length - 1]
  const endsWithBand = last?.kind === 'section' && !isRichEmpty(last.html)

  const inner = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${canvas}" style="background:${canvas};">
    <tr>
      <td align="center" style="padding:0;">
        <!--[if mso]><table role="presentation" width="${width}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="${width}" cellpadding="0" cellspacing="0" border="0" bgcolor="${paper}" style="width:${width}px;max-width:${width}px;background:${paper};font-family:${FONT};${frame ? `border:1px solid ${frame};` : ''}">
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
