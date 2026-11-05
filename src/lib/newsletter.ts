import type { Campaign } from '../types'
import { DEFAULT_FONT, DEFAULT_SIZE, FONTS, FONT_SIZES } from './fonts'

/*
 * The Newsletter studio master. Banner text lives in the ordinary campaign
 * columns (kicker, title, subtitle, banner_image, register_label/url) so the
 * Copilot agent can fill it like any other master. Everything that is
 * newsletter-only (style, banner layout, body blocks with rich
 * text, footer) is one JSON document in campaign.newsletter.
 */

export type BannerLayout = 'band' | 'split' | 'image'
export type Align = 'left' | 'center' | 'right'

export interface NewsletterStyle {
  /** Headings, buttons, links, callout rule. */
  accent: string
  /** Area around the email (Outlook shows it on wide screens). */
  canvas: string
  /** Background of the email body, behind the blocks. */
  paper: string
  /** Link colour in the body. */
  link: string
  /** Typeface for the whole email (a name from lib/fonts). */
  font: string
  /** Body text size in px. */
  size: number
  /** Email width in pixels. */
  width: number
}

export interface NewsletterBanner {
  layout: BannerLayout
  align: Align
  background: string
  text: string
  /** The Microsoft four-square mark at the top of the banner. */
  showMark: boolean
  /** Optional uploaded logo (data URL) shown instead of the four-square mark. */
  logo: string
  /** Small label on the right of the mark row, e.g. "November 2026". */
  dateLabel: string
  /** Alt text for a banner image (full-image layout). */
  imageAlt: string
}

/** Blocks that can sit inside a card. */
export type InnerBlock =
  | { id: string; kind: 'text'; html: string }
  | {
      id: string
      kind: 'callout'
      html: string
      /** Shade behind the text. */
      background: string
      /** Show the coloured rule on the left. */
      showRule: boolean
      /** Rule colour; empty means the accent colour. */
      rule: string
      /** Text colour; empty means automatic (dark on light shades, white on dark). */
      text: string
    }
  | { id: string; kind: 'image'; src: string; alt: string; href: string; caption: string }
  | { id: string; kind: 'button'; label: string; url: string; align: Align; color: string }
  | { id: string; kind: 'divider' }

export type BodyBlock =
  | InnerBlock
  /** A bordered box holding its own blocks (text, buttons, images…). */
  | { id: string; kind: 'card'; border: string; background: string; items: InnerBlock[] }
  /** Picture on the left, rich text on the right, in a shaded row. */
  | { id: string; kind: 'media'; src: string; alt: string; imageWidth: number; html: string; background: string; border: string }
  /** Full-width colour band with its own text and link colours. */
  | { id: string; kind: 'section'; html: string; background: string; text: string; link: string }

export type BlockKind = BodyBlock['kind']
export type InnerKind = InnerBlock['kind']

export interface FooterLink {
  id: string
  label: string
  url: string
}

export interface NewsletterFooter {
  background: string
  text: string
  /** Rich text message (sanitized HTML), e.g. a sign-off or contact note. */
  html: string
  links: FooterLink[]
  showMark: boolean
  /** Optional uploaded logo (data URL) shown instead of the four-square mark. */
  logo: string
  /** Plain small print: copyright and address lines. */
  legal: string
}

export interface NewsletterDesign {
  version: 1
  style: NewsletterStyle
  banner: NewsletterBanner
  blocks: BodyBlock[]
  footer: NewsletterFooter
}

export const THEMES: { name: string; accent: string; banner: string; bannerText: string; footer: string; footerText: string }[] = [
  { name: 'Partner Skilling forest', accent: '#0B4F38', banner: '#0B4F38', bannerText: '#FFFFFF', footer: '#0B4F38', footerText: '#FFFFFF' },
  { name: 'Microsoft blue', accent: '#0067B8', banner: '#0067B8', bannerText: '#FFFFFF', footer: '#F2F2F2', footerText: '#505050' },
  { name: 'Midnight', accent: '#243A5E', banner: '#243A5E', bannerText: '#FFFFFF', footer: '#243A5E', footerText: '#FFFFFF' },
  { name: 'Purple', accent: '#5C2D91', banner: '#5C2D91', bannerText: '#FFFFFF', footer: '#F3EEF8', footerText: '#3B1D5E' },
  { name: 'Light', accent: '#0B4F38', banner: '#EBF3EF', bannerText: '#0B4F38', footer: '#F5F5F5', footerText: '#505050' },
]

export const WIDTHS = [600, 640, 720]

export const CALLOUT_COLORS = ['#EBF3EF', '#DEECF9', '#FFF4CE', '#F3EEF8', '#F5F5F5']

export const PRIVACY_URL = 'https://go.microsoft.com/fwlink/?LinkId=521839'

function id(): string {
  return crypto.randomUUID()
}

export function defaultDesign(): NewsletterDesign {
  const forest = THEMES[0]
  return {
    version: 1,
    style: { accent: forest.accent, canvas: '#FFFFFF', paper: '#FFFFFF', link: '#0067C0', font: DEFAULT_FONT, size: DEFAULT_SIZE, width: 640 },
    banner: {
      layout: 'band',
      align: 'left',
      background: forest.banner,
      text: forest.bannerText,
      showMark: true,
      logo: '',
      dateLabel: '',
      imageAlt: '',
    },
    blocks: [
      {
        id: id(),
        kind: 'text',
        html: '<p>Hi all,</p><p>Start writing your newsletter here. Use the toolbar for <strong>bold</strong>, headings, lists, colours, and links.</p>',
      },
    ],
    footer: {
      background: forest.footer,
      text: forest.footerText,
      html: '<p>Questions? Reply to this email and the Partner Skilling team will get back to you.</p>',
      links: [{ id: id(), label: 'Privacy Statement', url: PRIVACY_URL }],
      showMark: true,
      logo: '',
      legal: `© ${new Date().getFullYear()} Microsoft Corporation. All rights reserved.\nMicrosoft Corporation, One Microsoft Way, Redmond, WA 98052 USA`,
    },
  }
}

export function newBlock(kind: BlockKind): BodyBlock {
  switch (kind) {
    case 'card':
      return { id: id(), kind, border: '#D4EC8E', background: '#FFFFFF', items: [{ id: id(), kind: 'text', html: '' }] }
    case 'media':
      return { id: id(), kind, src: '', alt: '', imageWidth: 160, html: '', background: '#B9DCD2', border: '' }
    case 'section':
      return { id: id(), kind, html: '', background: '#194449', text: '#FFFFFF', link: '#6FC040' }
    default:
      return newInnerBlock(kind)
  }
}

export function newInnerBlock(kind: InnerKind): InnerBlock {
  switch (kind) {
    case 'text':
      return { id: id(), kind, html: '' }
    case 'callout':
      return { id: id(), kind, html: '', background: CALLOUT_COLORS[0], showRule: true, rule: '', text: '' }
    case 'image':
      return { id: id(), kind, src: '', alt: '', href: '', caption: '' }
    case 'button':
      return { id: id(), kind, label: 'Learn more', url: '', align: 'left', color: '' }
    default:
      return { id: id(), kind: 'divider' }
  }
}

export function newFooterLink(): FooterLink {
  return { id: id(), label: '', url: '' }
}

/** A copy of a block with fresh ids (cards copy their items too). */
export function cloneBlock<T extends BodyBlock>(block: T): T {
  if (block.kind === 'card') {
    return { ...block, id: id(), items: block.items.map((item) => ({ ...item, id: id() })) }
  }
  return { ...block, id: id() }
}

const HEX = /^#[0-9a-f]{6}$/i

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX.test(value) ? value.toUpperCase() : fallback
}

/** A colour that may be left empty (meaning "use the default"). */
function optionalColor(value: unknown): string {
  return typeof value === 'string' && HEX.test(value) ? value.toUpperCase() : ''
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function readInner(r: Record<string, unknown>, blockId: string): InnerBlock | null {
  switch (r.kind) {
    case 'text':
      return { id: blockId, kind: 'text', html: text(r.html) }
    case 'callout':
      return {
        id: blockId,
        kind: 'callout',
        html: text(r.html),
        background: color(r.background, CALLOUT_COLORS[0]),
        showRule: r.showRule !== false,
        rule: optionalColor(r.rule),
        text: optionalColor(r.text),
      }
    case 'image':
      return {
        id: blockId,
        kind: 'image',
        src: text(r.src),
        alt: text(r.alt),
        href: text(r.href),
        caption: text(r.caption),
      }
    case 'button':
      return {
        id: blockId,
        kind: 'button',
        label: text(r.label, 'Learn more'),
        url: text(r.url),
        align: oneOf(r.align, ['left', 'center', 'right'] as const, 'left'),
        color: optionalColor(r.color),
      }
    case 'divider':
      return { id: blockId, kind: 'divider' }
    default:
      return null
  }
}

function readBlock(raw: unknown): BodyBlock | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const blockId = text(r.id) || id()
  switch (r.kind) {
    case 'card':
      return {
        id: blockId,
        kind: 'card',
        border: optionalColor(r.border),
        background: color(r.background, '#FFFFFF'),
        items: Array.isArray(r.items)
          ? r.items
              .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
              .map((item) => readInner(item, text(item.id) || id()))
              .filter((item): item is InnerBlock => Boolean(item))
          : [],
      }
    case 'media': {
      const width = Number(r.imageWidth)
      return {
        id: blockId,
        kind: 'media',
        src: text(r.src),
        alt: text(r.alt),
        imageWidth: [120, 160, 200].includes(width) ? width : 160,
        html: text(r.html),
        background: color(r.background, '#B9DCD2'),
        border: optionalColor(r.border),
      }
    }
    case 'section':
      return {
        id: blockId,
        kind: 'section',
        html: text(r.html),
        background: color(r.background, '#194449'),
        text: color(r.text, '#FFFFFF'),
        link: color(r.link, '#6FC040'),
      }
    default:
      return readInner(r, blockId)
  }
}

/** The campaign's newsletter design, with defaults for anything missing. */
export function readDesign(campaign: Pick<Campaign, 'newsletter'>): NewsletterDesign {
  const base = defaultDesign()
  let raw: Record<string, unknown> = {}
  try {
    const parsed = campaign.newsletter ? JSON.parse(campaign.newsletter) : null
    if (parsed && typeof parsed === 'object') raw = parsed
  } catch {
    return base
  }
  if (!Object.keys(raw).length) return base

  const style = (raw.style ?? {}) as Record<string, unknown>
  const banner = (raw.banner ?? {}) as Record<string, unknown>
  const footer = (raw.footer ?? {}) as Record<string, unknown>
  const width = Number(style.width)

  return {
    version: 1,
    style: {
      accent: color(style.accent, base.style.accent),
      canvas: color(style.canvas, base.style.canvas),
      paper: color(style.paper, base.style.paper),
      link: color(style.link, base.style.link),
      font: FONTS.some((font) => font.name === style.font) ? (style.font as string) : DEFAULT_FONT,
      size: FONT_SIZES.includes(Number(style.size)) ? Number(style.size) : DEFAULT_SIZE,
      width: WIDTHS.includes(width) ? width : base.style.width,
    },
    banner: {
      layout: oneOf(banner.layout, ['band', 'split', 'image'] as const, 'band'),
      align: oneOf(banner.align, ['left', 'center', 'right'] as const, 'left'),
      background: color(banner.background, base.banner.background),
      text: color(banner.text, base.banner.text),
      showMark: banner.showMark !== false,
      logo: text(banner.logo),
      dateLabel: text(banner.dateLabel),
      imageAlt: text(banner.imageAlt),
    },
    blocks: Array.isArray(raw.blocks)
      ? raw.blocks.map(readBlock).filter((block): block is BodyBlock => Boolean(block))
      : base.blocks,
    footer: {
      background: color(footer.background, base.footer.background),
      text: color(footer.text, base.footer.text),
      html: text(footer.html, base.footer.html),
      links: Array.isArray(footer.links)
        ? footer.links
            .filter((link): link is Record<string, unknown> => Boolean(link) && typeof link === 'object')
            .map((link) => ({ id: text(link.id) || id(), label: text(link.label), url: text(link.url) }))
        : base.footer.links,
      showMark: footer.showMark !== false,
      logo: text(footer.logo),
      legal: text(footer.legal, base.footer.legal),
    },
  }
}

export function writeDesign(design: NewsletterDesign): string {
  return JSON.stringify(design)
}

/** Picks readable text (black or white) for a background colour. */
export function readableOn(background: string): string {
  const hex = background.replace('#', '')
  if (hex.length !== 6) return '#FFFFFF'
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance > 0.4 ? '#1B1B1B' : '#FFFFFF'
}
