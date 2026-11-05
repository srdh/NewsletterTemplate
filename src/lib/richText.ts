import { fontFromCss, fontStack } from './fonts'

/*
 * Rich text for the Newsletter studio.
 *
 * sanitizeRichHtml: whatever the editor (or a paste from Word, a web page,
 * or Outlook) produces is reduced to a small, Outlook-safe subset: paragraphs,
 * three heading levels, quotes, lists, links, bold / italic / underline /
 * strikethrough, and spans carrying colour, highlight, or size. Everything
 * else is unwrapped to its text. This is what gets stored.
 *
 * emailRichHtml: turns the stored subset into email markup, with every style
 * inline (Outlook ignores <style> blocks in many clients), the house fonts,
 * and spacing that survives Outlook's Word rendering engine.
 */

const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'UL', 'OL', 'LI'])
const INLINE_TAGS = new Set(['STRONG', 'EM', 'U', 'S', 'A', 'SPAN', 'BR'])
const RENAME: Record<string, string> = {
  B: 'STRONG',
  I: 'EM',
  STRIKE: 'S',
  DEL: 'S',
  INS: 'U',
  FONT: 'SPAN',
  H4: 'H3',
  H5: 'H3',
  H6: 'H3',
}
/** Removed with everything inside them. */
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'SVG', 'IMG', 'VIDEO', 'AUDIO', 'CANVAS', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'FORM'])

/** Size keywords from the browser's font-size command, and <font size>. */
const SIZE_KEYWORD: Record<string, number> = {
  'x-small': 12,
  small: 13,
  medium: 15,
  large: 18,
  'x-large': 22,
  'xx-large': 26,
  'xxx-large': 30,
}
const FONT_SIZE_ATTR: Record<string, number> = { '1': 12, '2': 13, '3': 15, '4': 18, '5': 22, '6': 26, '7': 30 }

const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))$/i

function normalColor(value: string): string | null {
  const v = value.trim().toLowerCase()
  if (!v || v === 'transparent' || v === 'inherit' || v === 'initial' || v === 'currentcolor') return null
  if (!COLOR.test(v)) return null
  const rgba = v.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)$/)
  if (rgba) {
    if (rgba[4] !== undefined && Number(rgba[4]) === 0) return null
    return '#' + [rgba[1], rgba[2], rgba[3]].map((n) => Math.min(255, Number(n)).toString(16).padStart(2, '0')).join('').toUpperCase()
  }
  if (v.length === 4) return ('#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toUpperCase()
  return v.toUpperCase()
}

function normalSize(value: string): number | null {
  const v = value.trim().toLowerCase()
  if (SIZE_KEYWORD[v]) return SIZE_KEYWORD[v]
  const px = v.match(/^(\d+(?:\.\d+)?)px$/)
  if (px) return Math.max(8, Math.min(48, Math.round(Number(px[1]))))
  const pt = v.match(/^(\d+(?:\.\d+)?)pt$/)
  if (pt) return Math.max(8, Math.min(48, Math.round(Number(pt[1]) * 1.333)))
  return null
}

/** The only inline styles kept, normalized. */
function cleanStyle(el: HTMLElement, tag: string): string {
  const s = el.style
  const out: string[] = []
  const fg = normalColor(s.color || (tag === 'SPAN' ? el.getAttribute('color') ?? '' : ''))
  if (fg) out.push(`color:${fg}`)
  const bg = normalColor(s.backgroundColor)
  if (bg && bg !== '#FFFFFF' && tag !== 'LI' && tag !== 'UL' && tag !== 'OL') out.push(`background-color:${bg}`)
  const sizeAttr = el.getAttribute('size')
  const size = normalSize(s.fontSize) ?? (sizeAttr ? FONT_SIZE_ATTR[sizeAttr] ?? null : null)
  if (size && tag === 'SPAN') out.push(`font-size:${size}px`)
  // Typeface: only the fonts the studio offers, written as their full stack.
  const face = fontFromCss(s.fontFamily || (tag === 'SPAN' ? el.getAttribute('face') ?? '' : ''))
  if (face && tag === 'SPAN') out.push(`font-family:${fontStack(face)}`)
  if (BLOCK_TAGS.has(tag)) {
    const align = s.textAlign.toLowerCase()
    if (align === 'center' || align === 'right' || align === 'justify') out.push(`text-align:${align}`)
    const indent = parseInt(s.marginLeft || s.paddingLeft || '0', 10)
    if (tag !== 'LI' && indent >= 20) out.push(`margin-left:${Math.min(160, Math.round(indent / 40) * 40 || 40)}px`)
  }
  if (tag === 'SPAN') {
    const weight = s.fontWeight
    if (weight === 'bold' || Number(weight) >= 600) out.push('font-weight:bold')
    if (s.fontStyle === 'italic') out.push('font-style:italic')
    const deco = `${s.textDecorationLine || ''} ${s.textDecoration || ''}`
    const lines = [deco.includes('underline') ? 'underline' : '', deco.includes('line-through') ? 'line-through' : ''].filter(Boolean)
    if (lines.length) out.push(`text-decoration:${lines.join(' ')}`)
  }
  return out.join(';')
}

function safeHref(raw: string | null): string | null {
  const href = (raw ?? '').trim()
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href
  if (/^#/.test(href)) return null
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href)) return `https://${href}`
  return null
}

function copyChildren(source: Node, target: Node, doc: Document) {
  for (const child of Array.from(source.childNodes)) {
    const cleaned = cleanNode(child, doc)
    for (const node of cleaned) target.appendChild(node)
  }
}

/** Returns the cleaned replacement nodes for one node (zero, one, or many). */
function cleanNode(node: Node, doc: Document): Node[] {
  if (node.nodeType === Node.TEXT_NODE) {
    return [doc.createTextNode((node.textContent ?? '').replace(/ /g, ' '))]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const el = node as HTMLElement
  let tag = el.tagName.toUpperCase()
  // Word's namespaced tags (<o:p>, <w:sdt>) keep their text.
  if (tag.includes(':')) {
    const holder = doc.createElement('span')
    copyChildren(el, holder, doc)
    return Array.from(holder.childNodes)
  }
  if (DROP_TAGS.has(tag)) return []
  tag = RENAME[tag] ?? tag
  if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'HEADER' || tag === 'FOOTER' || tag === 'TD' || tag === 'TH' || tag === 'DD' || tag === 'DT' || tag === 'PRE' || tag === 'FIGURE' || tag === 'FIGCAPTION' || tag === 'CENTER') {
    // A div holding only inline content is a paragraph; one holding blocks
    // is just a wrapper.
    const hasBlock = Array.from(el.querySelectorAll('*')).some((child) => {
      const t = RENAME[child.tagName.toUpperCase()] ?? child.tagName.toUpperCase()
      return BLOCK_TAGS.has(t) || t === 'DIV' || t === 'TABLE' || t === 'TR'
    })
    if (hasBlock) {
      const holder = doc.createElement('div')
      copyChildren(el, holder, doc)
      return Array.from(holder.childNodes)
    }
    tag = 'P'
  }
  if (tag === 'TABLE' || tag === 'TBODY' || tag === 'THEAD' || tag === 'TR') {
    const holder = doc.createElement('div')
    copyChildren(el, holder, doc)
    return Array.from(holder.childNodes)
  }
  if (!BLOCK_TAGS.has(tag) && !INLINE_TAGS.has(tag)) {
    const holder = doc.createElement('span')
    copyChildren(el, holder, doc)
    return Array.from(holder.childNodes)
  }

  const out = doc.createElement(tag)
  if (tag === 'A') {
    const href = safeHref(el.getAttribute('href'))
    if (!href) {
      const holder = doc.createElement('span')
      copyChildren(el, holder, doc)
      return Array.from(holder.childNodes)
    }
    out.setAttribute('href', href)
  }
  if (tag !== 'BR') {
    const style = cleanStyle(el, tag)
    if (style) out.setAttribute('style', style)
    copyChildren(el, out, doc)
  }
  // Spans with nothing to say are unwrapped.
  if (tag === 'SPAN' && !out.getAttribute('style')) return Array.from(out.childNodes)
  // Word marks bold with <b style="font-weight:normal"> in Google Docs pastes.
  if (tag === 'STRONG' && /font-weight:\s*(normal|400)/i.test(el.getAttribute('style') ?? '')) {
    return Array.from(out.childNodes)
  }
  return [out]
}

/** Wraps loose inline content at the top level into paragraphs. */
function wrapLoose(root: HTMLElement, doc: Document) {
  let run: Node[] = []
  const flush = (before: Node | null) => {
    const meaningful = run.some((n) => n.nodeType !== Node.TEXT_NODE || (n.textContent ?? '').trim())
    if (meaningful) {
      const p = doc.createElement('p')
      run.forEach((n) => p.appendChild(n))
      root.insertBefore(p, before)
    } else {
      run.forEach((n) => n.parentNode?.removeChild(n))
    }
    run = []
  }
  for (const child of Array.from(root.childNodes)) {
    const isBlock = child.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((child as Element).tagName)
    if (isBlock) flush(child)
    else run.push(child)
  }
  flush(null)
}

/** List items must sit in a list; loose <li> becomes a paragraph. */
function fixStructure(root: HTMLElement, doc: Document) {
  root.querySelectorAll('li').forEach((li) => {
    const parent = li.parentElement
    if (parent && parent.tagName !== 'UL' && parent.tagName !== 'OL') {
      const p = doc.createElement('p')
      while (li.firstChild) p.appendChild(li.firstChild)
      li.replaceWith(p)
    }
  })
  // Paragraphs inside list items or headings are flattened.
  root.querySelectorAll('li > p, h1 > p, h2 > p, h3 > p, p > p').forEach((p) => {
    const parent = p.parentElement
    if (!parent) return
    if (p.nextSibling && parent.tagName !== 'P') p.after(doc.createElement('br'))
    while (p.firstChild) parent.insertBefore(p.firstChild, p)
    p.remove()
  })
  // Empty inline wrappers, and empty blocks the browser leaves behind
  // (a deliberate blank line keeps its <br>).
  root.querySelectorAll('strong, em, u, s, span, a, p, h1, h2, h3, blockquote').forEach((el) => {
    if (!el.textContent && !el.querySelector('br')) el.remove()
  })
}

function parse(html: string): Document | null {
  if (typeof DOMParser === 'undefined') return null
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

/** Reduces any HTML to the stored, Outlook-safe subset. */
export function sanitizeRichHtml(html: string): string {
  const doc = parse(html.replace(/<!--[\s\S]*?-->/g, ''))
  if (!doc) return html
  const root = doc.createElement('div')
  copyChildren(doc.body, root, doc)
  fixStructure(root, doc)
  wrapLoose(root, doc)
  // Trailing empty paragraphs the editor leaves behind.
  while (root.lastElementChild && root.lastElementChild.tagName === 'P' && !root.lastElementChild.textContent?.trim()) {
    root.lastElementChild.remove()
  }
  return root.innerHTML.replace(/&nbsp;/g, ' ')
}

/** Plain text pasted into the editor: paragraphs at blank lines. */
export function textToRichHtml(text: string): string {
  const escape = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function isRichEmpty(html: string): boolean {
  return !html.replace(/<[^>]+>/g, '').replace(/&nbsp;| /g, '').trim()
}

export interface RichTextLook {
  font: string
  color: string
  link: string
  accent: string
  /** Base paragraph size in px. */
  size?: number
}

const STYLE_BY_TAG = (look: RichTextLook): Record<string, string> => {
  const size = look.size ?? 15
  return {
    P: `margin:0 0 14px;font-family:${look.font};font-size:${size}px;line-height:1.55;color:${look.color};`,
    H1: `margin:6px 0 12px;font-family:${look.font};font-size:26px;line-height:1.25;font-weight:700;color:${look.accent};`,
    H2: `margin:6px 0 10px;font-family:${look.font};font-size:20px;line-height:1.3;font-weight:700;color:${look.accent};`,
    H3: `margin:4px 0 8px;font-family:${look.font};font-size:17px;line-height:1.35;font-weight:600;color:${look.color};`,
    UL: `margin:0 0 14px 24px;padding:0;font-family:${look.font};font-size:${size}px;line-height:1.5;color:${look.color};`,
    OL: `margin:0 0 14px 24px;padding:0;font-family:${look.font};font-size:${size}px;line-height:1.5;color:${look.color};`,
    LI: `margin:0 0 6px;padding:0;`,
    BLOCKQUOTE: `margin:0 0 14px;padding:4px 0 4px 16px;border-left:3px solid ${look.accent};font-family:${look.font};font-size:${size}px;line-height:1.55;color:${look.color};font-style:italic;`,
    A: `color:${look.link};text-decoration:underline;`,
  }
}

/** Stored rich text as email markup with inline styles. */
export function emailRichHtml(html: string, look: RichTextLook): string {
  const doc = parse(html)
  if (!doc) return html
  const base = STYLE_BY_TAG(look)
  doc.body.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const tag = el.tagName.toUpperCase()
    let own = (el.getAttribute('style') ?? '').trim()
    if (own && !own.endsWith(';')) own += ';'
    // An indented quote (Indent button) has no rule, just the indent.
    if (tag === 'BLOCKQUOTE' && /margin-left/.test(own)) {
      el.setAttribute(
        'style',
        `margin:0 0 14px;padding:0;font-family:${look.font};font-size:${look.size ?? 15}px;line-height:1.55;color:${look.color};${own}`,
      )
      return
    }
    const defaults = base[tag]
    if (defaults || own) el.setAttribute('style', `${defaults ?? ''}${own}`)
    if (tag === 'A') el.setAttribute('target', '_blank')
  })
  // Outlook drops the bottom margin of the last paragraph inconsistently, so
  // the final block carries none; the cell padding spaces the next block.
  const last = doc.body.lastElementChild
  if (last) last.setAttribute('style', `${last.getAttribute('style') ?? ''}margin-bottom:0;`)
  return doc.body.innerHTML
}
