import { useId, useMemo, useState, type ReactNode } from 'react'
import { usePopover } from '../hooks/usePopover'
import { MS_PRIMARY, MS_SECONDARY, paletteName, type PaletteColor } from '../lib/palette'
import {
  CALLOUT_COLORS,
  THEMES,
  WIDTHS,
  cloneBlock,
  newBlock,
  newFooterLink,
  newSpotlight,
  newDetailRow,
  newStatTile,
  newTextColumn,
  newGalleryImage,
  newPerson,
  readDesign,
  readableOn,
  writeDesign,
  type Align,
  type BannerLayout,
  type BlockKind,
  type BodyBlock,
  type InnerBlock,
  type NewsletterDesign,
} from '../lib/newsletter'
import { isRichEmpty } from '../lib/richText'
import type { Campaign, CampaignBundle } from '../types'
import { Field, ImageField, Section, Subheading } from './FieldForm'
import { IconChevron, IconDuplicate, IconPlus, IconTrash } from './Icons'
import { EditorLookContext, RichTextEditor } from './RichTextEditor'
import { FONTS, FONT_SIZES, fontStack } from '../lib/fonts'
import { t } from '../lib/i18n'

export const KIND_LABEL: Record<BlockKind, string> = {
  get text() {
    return t("Text")
  },
  get callout() {
    return t("Callout")
  },
  get image() {
    return t("Image")
  },
  get button() {
    return t("Button")
  },
  get divider() {
    return t("Divider")
  },
  get card() {
    return t("Card")
  },
  get media() {
    return t("Image + text")
  },
  get section() {
    return t("Colour band")
  },
  get event() {
    return t("Event card")
  },
  get table() {
    return t("Table")
  },
  get spotlights() {
    return t("Spotlight cards")
  },
  get signature() {
    return t("Signature")
  },
  get heading() {
    return t("Heading")
  },
  get details() {
    return t("Details")
  },
  get stats() {
    return t("Number tiles")
  },
  get columns() {
    return t("Columns")
  },
  get gallery() {
    return t("Photo gallery")
  },
  get people() {
    return t("People")
  },
}

export const KIND_HINT: Record<BlockKind, string> = {
  get text() {
    return t("Paragraphs, headings, lists, links")
  },
  get callout() {
    return t("Shaded box for an action or note")
  },
  get image() {
    return t("Full-width picture, optional link")
  },
  get button() {
    return t("Call-to-action button")
  },
  get divider() {
    return t("Thin line between sections")
  },
  get card() {
    return t("Bordered box that holds its own text, buttons, and images")
  },
  get media() {
    return t("Picture beside rich text, e.g. a badge and its list")
  },
  get section() {
    return t("Full-width coloured band with its own text colour")
  },
  get event() {
    return t("Date, time, place, details, and a button")
  },
  get table() {
    return t("Rows and columns, with an optional header row")
  },
  get spotlights() {
    return t("Two or three cards side by side")
  },
  get signature() {
    return t("Sign-off with name, role, team, and email")
  },
  get heading() {
    return t("A section heading with an optional line under it")
  },
  get details() {
    return t("Label : value rows in a box, e.g. login details")
  },
  get stats() {
    return t("Big numbers with labels, e.g. 28 Hackathons")
  },
  get columns() {
    return t("Two or three columns of text, each with a title")
  },
  get gallery() {
    return t("Photos in a grid of two or three")
  },
  get people() {
    return t("Names, roles, and round photos, e.g. sponsors")
  },
}

/** What can go in the email body, and what can go inside a card. */
const BODY_KINDS: BlockKind[] = ['text', 'card', 'button', 'image', 'media', 'callout', 'section', 'divider']
const CARD_KINDS: BlockKind[] = ['text', 'button', 'image', 'callout', 'divider']

/** Quick picks for button colours, besides the accent. */
const BUTTON_COLORS: [string, string][] = [
  ['#07641D', 'Dark green'],
  ['#D4EC8E', 'Lime'],
  ['#0067B8', 'Blue'],
  ['#243A5E', 'Midnight'],
  ['#FFFFFF', 'White'],
]

const LAYOUTS: [BannerLayout, string][] = [
  ['band', 'Colour band'],
  ['split', 'Text + image'],
  ['image', 'Full image'],
]

const ALIGNS: [Align, string][] = [
  ['left', 'Left'],
  ['center', 'Center'],
  ['right', 'Right'],
]

/**
 * The Newsletter studio form: Style, Banner, Body (blocks with rich text),
 * Footer. Banner text uses the shared campaign columns; the rest is the
 * design JSON in campaign.newsletter.
 */
export function NewsletterFields({
  bundle,
  set,
}: {
  bundle: CampaignBundle
  set: (patch: Partial<Campaign>) => void
}) {
  const c = bundle.campaign
  // Parsed once per saved value, so block ids (and the editors keyed by them)
  // stay put while you type.
  const design = useMemo(() => readDesign(c), [c.newsletter]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = (next: NewsletterDesign) => set({ newsletter: writeDesign(next) })
  const patch = <K extends keyof NewsletterDesign>(key: K, value: Partial<NewsletterDesign[K]>) =>
    save({ ...design, [key]: { ...(design[key] as object), ...(value as object) } })

  return (
    <EditorLookContext.Provider value={{ font: design.style.font, size: design.style.size }}>
      <StyleSection design={design} save={save} patch={patch} />
      <BannerSection campaign={c} set={set} design={design} patch={patch} />
      <BodySection design={design} save={save} />
      <FooterSection design={design} patch={patch} />
    </EditorLookContext.Provider>
  )
}

export type Patch = <K extends keyof NewsletterDesign>(key: K, value: Partial<NewsletterDesign[K]>) => void

export function StyleSection({
  design,
  save,
  patch,
}: {
  design: NewsletterDesign
  save: (next: NewsletterDesign) => void
  patch: Patch
}) {
  return (
    <Section title={t("Style")} anchor="style" noCopilot>
      <div>
        <span className="mb-1.5 block text-[12px] font-medium text-muted">{t("Theme")}</span>
        <Cols className="gap-1.5 @[22rem]:grid-cols-2 @[30rem]:grid-cols-3">
          {THEMES.map((theme) => {
            const on =
              design.style.accent === theme.accent &&
              design.banner.background === theme.banner &&
              design.footer.background === theme.footer
            return (
              <button
                key={theme.name}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  save({
                    ...design,
                    style: { ...design.style, accent: theme.accent },
                    banner: { ...design.banner, background: theme.banner, text: theme.bannerText },
                    footer: { ...design.footer, background: theme.footer, text: theme.footerText },
                  })
                }
                className={
                  'flex items-center gap-2 rounded-[var(--r-sm)] border px-2 py-1.5 text-left text-[12px] leading-4 transition-colors ' +
                  (on ? 'border-forest bg-forest-soft font-semibold text-ink' : 'border-line bg-surface text-ink-2 hover:bg-fill')
                }
              >
                <span aria-hidden="true" className="flex shrink-0 overflow-hidden rounded-[3px] ring-1 ring-line">
                  <span className="h-5 w-3" style={{ background: theme.banner }} />
                  <span className="h-5 w-2 bg-white" />
                  <span className="h-5 w-3" style={{ background: theme.footer }} />
                </span>
                <span className="min-w-0 truncate">{theme.name}</span>
              </button>
            )
          })}
        </Cols>
      </div>
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <ColorField
          label={t("Accent colour")}
          hint={t("Headings, buttons, and the callout rule.")}
          value={design.style.accent}
          onChange={(accent) => patch('style', { accent })}
        />
        <ColorField
          label={t("Link colour")}
          hint={t("Links in the body and cards.")}
          value={design.style.link}
          onChange={(link) => patch('style', { link })}
        />
      </Cols>
      <Cols className="gap-3.5 @[22rem]:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-muted">{t("Font")}</span>
          <select
            value={design.style.font}
            onChange={(event) => patch('style', { font: event.target.value })}
            className="ui-field"
            style={{ fontFamily: fontStack(design.style.font) }}
          >
            {FONTS.map((font) => (
              <option key={font.name} value={font.name} style={{ fontFamily: font.stack }}>
                {font.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] text-muted">{t("For the whole email. Change single words with the toolbar.")}</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-muted">{t("Text size")}</span>
          <select
            value={String(design.style.size)}
            onChange={(event) => patch('style', { size: Number(event.target.value) })}
            className="ui-field w-[96px]"
          >
            {FONT_SIZES.filter((size) => size >= 12 && size <= 20).map((size) => (
              <option key={size} value={String(size)}>
                {size}px
              </option>
            ))}
          </select>
        </label>
      </Cols>
      <Segmented
        label={t("Email width")}
        value={String(design.style.width)}
        options={WIDTHS.map((w) => [String(w), `${w}px`])}
        onChange={(width) => patch('style', { width: Number(width) })}
      />
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <ColorField
          label={t("Email body colour")}
          value={design.style.paper}
          onChange={(paper) => patch('style', { paper })}
        />
        <ColorField
          label={t("Around the email")}
          value={design.style.canvas}
          onChange={(canvas) => patch('style', { canvas })}
        />
      </Cols>
      <OptionalColor label={t("Border around the email")} value={design.style.frame} fallback="#D1D1D1" onChange={(frame) => patch('style', { frame })} />
    </Section>
  )
}


export function BannerSection({
  campaign,
  set,
  design,
  patch,
}: {
  campaign: Campaign
  set: (patch: Partial<Campaign>) => void
  design: NewsletterDesign
  patch: Patch
}) {
  const b = design.banner
  const needsImage = b.layout !== 'band'
  return (
    <Section title={t("Banner")} anchor="banner">
      <Segmented
        label={t("Layout")}
        value={b.layout}
        options={LAYOUTS}
        onChange={(layout) => patch('banner', { layout: layout as BannerLayout })}
      />
      {needsImage ? (
        <ImageField
          label={b.layout === 'image' ? t("Banner image") : t("Banner art")}
          hint={
            b.layout === 'image'
              ? t("Shown edge to edge at the top. A wide image with the headline in it works well (about 1280 × 720).")
              : t("Shown to the right of the headline. Transparent PNGs work best.")
          }
          value={campaign.banner_image ?? ''}
          fallbackLabel={t("No image yet. The banner shows as a colour band until you add one.")}
          maxWidth={b.layout === 'image' ? 1440 : 400}
          onChange={(banner_image) => set({ banner_image })}
        />
      ) : null}
      {b.layout === 'image' ? (
        <Field
          label={t("Banner image alt text")}
          hint={t("Say what the picture says, for screen readers and blocked images.")}
          value={b.imageAlt}
          onChange={(imageAlt) => patch('banner', { imageAlt })}
        />
      ) : null}
      <Field label={t("Eyebrow")} hint={t("Small line above the headline.")} value={campaign.kicker} onChange={(kicker) => set({ kicker })} />
      <Field
        label={t("Headline")}
        hint={b.layout === 'image' ? t("Optional with a full image: leave empty when the image carries the headline.") : undefined}
        value={campaign.title}
        onChange={(title) => set({ title })}
      />
      <Field label={t("Subheadline")} value={campaign.subtitle} onChange={(subtitle) => set({ subtitle })} />
      <Segmented
        label={t("Text alignment")}
        value={b.align}
        options={ALIGNS}
        onChange={(align) => patch('banner', { align: align as Align })}
      />
      <Subheading>{t("Logo row")}</Subheading>
      <Cols className="gap-3.5 @[22rem]:grid-cols-[1fr_auto]">
        <Field
          label={t("Date label")}
          hint={t("Right side of the logo row, e.g. November 2026.")}
          value={b.dateLabel}
          onChange={(dateLabel) => patch('banner', { dateLabel })}
        />
        <Toggle label={t("Microsoft logo")} checked={b.showMark} onChange={(showMark) => patch('banner', { showMark })} />
      </Cols>
      {b.layout !== 'image' ? (
        <Toggle
          label={t("Logo row on a white strip above the banner")}
          checked={b.logoBar}
          onChange={(logoBar) => patch('banner', { logoBar })}
        />
      ) : null}
      {b.showMark ? (
        <ImageField
          label={t("Logo image (optional)")}
          hint={t("Replaces the four-square mark, e.g. the full Microsoft logo. Shown 30px tall.")}
          value={b.logo}
          fallbackLabel={t("Four-square mark")}
          maxWidth={480}
          onChange={(logo) => patch('banner', { logo })}
        />
      ) : null}
      <ImageField
        label={t("Right-side logo (optional)")}
        hint={t("A partner or event logo on the right of the logo row. Replaces the date label. Shown 30px tall.")}
        value={b.rightLogo}
        fallbackLabel={t("None")}
        maxWidth={480}
        onChange={(rightLogo) => patch('banner', { rightLogo })}
      />
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <ColorField label={t("Banner colour")} value={b.background} onChange={(background) => patch('banner', { background })} />
        <ColorField label={t("Banner text")} value={b.text} onChange={(text) => patch('banner', { text })} />
      </Cols>
      <Subheading>{t("Banner button (optional)")}</Subheading>
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <Field label={t("Button label")} value={campaign.register_label} onChange={(register_label) => set({ register_label })} />
        <Field label={t("Button link")} value={campaign.register_url} onChange={(register_url) => set({ register_url })} />
      </Cols>
    </Section>
  )
}

function BodySection({ design, save }: { design: NewsletterDesign; save: (next: NewsletterDesign) => void }) {
  return (
    <Section title={t("Body")} anchor="body" noCopilot>
      <p className="-mt-2 text-[12px] leading-4 text-muted">
        {t("The newsletter body is a stack of blocks. Write in text blocks with the toolbar (headings, bold, colour, lists, links). Cards group text and buttons in a bordered box; colour bands span the full width.")}</p>
      <BlockList
        blocks={design.blocks}
        kinds={BODY_KINDS}
        accent={design.style.accent}
        onChange={(blocks) => save({ ...design, blocks })}
      />
    </Section>
  )
}

/** An editable stack of blocks: the email body, or the inside of a card. */
function BlockList({
  blocks,
  kinds,
  accent,
  onChange,
  owner,
}: {
  blocks: BodyBlock[]
  kinds: BlockKind[]
  accent: string
  onChange: (blocks: BodyBlock[]) => void
  /** Names nested editors, e.g. "Card 4". Empty for the email body. */
  owner?: string
}) {
  // Blocks start open; this remembers the ones you folded away.
  const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set())
  const nested = Boolean(owner)
  const toggle = (blockId: string) =>
    setClosedIds((current) => {
      const next = new Set(current)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })

  const cards = blocks.filter((block) => block.kind === 'card')
  const cardCount = cards.length

  /** A new empty card styled like an existing one (or the last card in the email). */
  function cardLike(source?: BodyBlock): BodyBlock {
    const fresh = newBlock('card')
    if (fresh.kind !== 'card' || !source || source.kind !== 'card') return fresh
    return { ...fresh, border: source.border, background: source.background }
  }

  function add(kind: BlockKind) {
    onChange([...blocks, kind === 'card' ? cardLike(cards[cards.length - 1]) : newBlock(kind)])
  }

  function addCardLike(index: number) {
    onChange([...blocks.slice(0, index + 1), cardLike(blocks[index]), ...blocks.slice(index + 1)])
  }

  function styleAllCards(source: BodyBlock) {
    if (source.kind !== 'card') return
    onChange(
      blocks.map((block) =>
        block.kind === 'card' ? { ...block, border: source.border, background: source.background } : block,
      ),
    )
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2.5">
      {blocks.length === 0 ? (
        <p className="rounded-[var(--r-md)] border border-dashed border-line-strong px-3 py-4 text-center text-[13px] text-muted">
          {nested ? t("This card is empty. Add a text block or a button.") : t("No blocks yet. Add a text block to start writing.")}
        </p>
      ) : null}
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
        {blocks.map((block, index) => {
          const open = !closedIds.has(block.id)
          const update = (next: BodyBlock) => onChange(blocks.map((item) => (item.id === block.id ? next : item)))
          const name = nested ? `${owner} · ${KIND_LABEL[block.kind].toLowerCase()} ${index + 1}` : t('{kind} block {n}', { kind: KIND_LABEL[block.kind], n: index + 1 })
          return (
            <li
              key={block.id}
              className={'min-w-0 rounded-[var(--r-md)] border ' + (nested ? 'border-line bg-panel' : 'border-line bg-surface')}
            >
              <div className="flex items-center gap-0.5 py-1 pr-1 pl-1">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggle(block.id)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[var(--r-sm)] px-1.5 py-1 text-left hover:bg-fill"
                >
                  <IconChevron className={'shrink-0 text-muted transition-transform ' + (open ? '' : '-rotate-90')} />
                  <span
                    className={
                      'shrink-0 rounded-full px-2 py-px text-[11px] font-semibold leading-4 ' +
                      (block.kind === 'card' || block.kind === 'section' ? 'bg-forest-soft text-forest' : 'bg-fill text-ink-2')
                    }
                  >
                    {index + 1}. {KIND_LABEL[block.kind]}
                  </span>
                  <span className="min-w-0 truncate text-[12px] leading-4 text-muted">{blockSummary(block)}</span>
                </button>
                <IconButton label={t("Move up")} disabled={index === 0} onClick={() => move(index, -1)}>
                  <IconChevron className="rotate-180" />
                </IconButton>
                <IconButton label={t("Move down")} disabled={index === blocks.length - 1} onClick={() => move(index, 1)}>
                  <IconChevron />
                </IconButton>
                <IconButton
                  label={t("Duplicate block")}
                  onClick={() => onChange([...blocks.slice(0, index + 1), cloneBlock(block), ...blocks.slice(index + 1)])}
                >
                  <IconDuplicate />
                </IconButton>
                <IconButton
                  label={t("Delete block")}
                  danger
                  onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}
                >
                  <IconTrash />
                </IconButton>
              </div>
              {open ? (
                <div className="border-t border-line px-3 pt-3 pb-3">
                  <BlockEditor
                    block={block}
                    name={name}
                    index={index}
                    accent={accent}
                    onChange={update}
                    cardActions={block.kind === 'card' ? { addLike: () => addCardLike(index), styleAll: () => styleAllCards(block), cardCount } : undefined}
                  />
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
      <div className={'rounded-[var(--r-md)] p-2 ' + (nested ? 'border border-dashed border-line-strong' : 'bg-fill')}>
        <p className="px-1 pb-1.5 text-[12px] font-semibold leading-4 text-ink-2">{nested ? t('Add to {owner}', { owner: owner ?? '' }) : t("Add a block")}</p>
        <Cols className="gap-1.5 @[14rem]:grid-cols-2 @[24rem]:grid-cols-3 @[30rem]:grid-cols-4">
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => add(kind)}
              title={KIND_HINT[kind]}
              className="flex items-center gap-1.5 rounded-[var(--r-sm)] border border-line bg-surface px-2 py-1.5 text-left text-[13px] font-semibold leading-4 text-ink transition-colors hover:border-forest-line hover:bg-forest-soft"
            >
              <span className="shrink-0 text-forest">
                <IconPlus />
              </span>
              <span className="min-w-0 truncate">{KIND_LABEL[kind]}</span>
            </button>
          ))}
        </Cols>
      </div>
    </div>
  )
}

function plain(html: string): string {
  return html.replace(/<(br|\/p|\/h\d|\/li)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export function blockSummary(block: BodyBlock): string {
  switch (block.kind) {
    case 'text':
    case 'callout':
    case 'section':
      return isRichEmpty(block.html) ? t("Empty") : plain(block.html)
    case 'media':
      return isRichEmpty(block.html) ? (block.src ? t("Image, no text yet") : t("Empty")) : plain(block.html)
    case 'card': {
      const first = block.items.find((item) => item.kind === 'text' && !isRichEmpty(item.html))
      const count = t(block.items.length === 1 ? '{n} item' : '{n} items', { n: block.items.length })
      return first && first.kind === 'text' ? `${plain(first.html)} · ${count}` : count
    }
    case 'image':
      return block.src ? block.alt || block.caption || t("Image added") : t("No image yet")
    case 'button':
      return block.label || t("No label")
    case 'event':
      return block.title || [block.date, block.time].filter(Boolean).join(' · ') || t("Event details")
    case 'table': {
      const rows = block.rows.length - (block.header ? 1 : 0)
      return t(rows === 1 ? '{n} row' : '{n} rows', { n: rows }) + (block.title ? ` · ${block.title}` : '')
    }
    case 'spotlights':
      return t(block.cards.length === 1 ? '{n} card' : '{n} cards', { n: block.cards.length })
    case 'signature':
      return [block.name, block.team].filter(Boolean).join(', ') || t("No name yet")
    case 'heading':
      return block.title || t("No heading yet")
    case 'details':
      return [block.title, t(block.rows.length === 1 ? '{n} row' : '{n} rows', { n: block.rows.length })].filter(Boolean).join(' · ')
    case 'stats':
      return block.tiles.map((tile) => `${tile.value} ${tile.label}`.trim()).join(' · ') || t("No tiles yet")
    case 'columns':
      return block.columns.map((column) => column.title).filter(Boolean).join(' · ') || t('{n} columns', { n: block.columns.length })
    case 'gallery': {
      const added = block.images.filter((image) => image.src).length
      return t(block.images.length === 1 ? '{added} of {n} photo added' : '{added} of {n} photos added', { added, n: block.images.length })
    }
    case 'people':
      return [block.title, `${block.people.length} ${block.people.length === 1 ? 'person' : 'people'}`].filter(Boolean).join(' · ')
    default:
      return ''
  }
}

export function BlockEditor({
  block,
  name,
  index,
  accent,
  onChange,
  cardActions,
}: {
  block: BodyBlock
  name: string
  index: number
  accent: string
  onChange: (block: BodyBlock) => void
  /** Cards only: add a matching card below, or restyle every card. */
  cardActions?: { addLike: () => void; styleAll: () => void; cardCount: number }
}) {
  switch (block.kind) {
    case 'text':
      return (
        <RichTextEditor
          label={name}
          placeholder={t("Write a paragraph, add a heading, or paste from Word…")}
          value={block.html}
          onChange={(html) => onChange({ ...block, html })}
        />
      )
    case 'callout':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <div>
            <span className="mb-1 block text-[12px] font-medium text-muted">{t("Shade")}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[...CALLOUT_COLORS, ...CALLOUT_DARK].map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={t('Shade {color}', { color })}
                  aria-pressed={block.background === color}
                  onClick={() => onChange({ ...block, background: color })}
                  className={
                    'h-6 w-6 rounded-full ring-inset transition-shadow ' +
                    (block.background === color ? 'ring-2 ring-forest ring-offset-1' : 'ring-1 ring-line-strong')
                  }
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <ColorField label={t("Shade colour")} value={block.background} onChange={(background) => onChange({ ...block, background })} />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <div className="grid gap-1.5">
              <Toggle label={t("Left rule")} checked={block.showRule} onChange={(showRule) => onChange({ ...block, showRule })} />
              {block.showRule ? (
                <AutoColor
                  label={t("Rule colour")}
                  autoLabel={t("Accent")}
                  autoSwatch={accent}
                  value={block.rule}
                  fallback={accent}
                  onChange={(rule) => onChange({ ...block, rule })}
                />
              ) : null}
            </div>
            <AutoColor
              label={t("Text colour")}
              autoLabel={t("Automatic")}
              autoSwatch={readableOn(block.background) === '#FFFFFF' ? '#FFFFFF' : '#242424'}
              value={block.text}
              fallback="#242424"
              onChange={(text) => onChange({ ...block, text })}
            />
          </Cols>
          <OptionalColor label={t("Border")} value={block.border ?? ''} fallback="#C7E0F4" onChange={(border) => onChange({ ...block, border })} />
          <CalloutSample block={block} accent={accent} />
          <RichTextEditor
            compact
            label={name}
            placeholder={t("e.g. Action: invite your partners to register before Friday.")}
            value={block.html}
            onChange={(html) => onChange({ ...block, html })}
            minHeight={72}
          />
        </div>
      )
    case 'image':
      return (
        <div className="grid gap-3">
          <ImageField
            label={t("Image")}
            hint={t("Shown at full width. PNG, JPG, GIF, or WebP.")}
            value={block.src}
            fallbackLabel={t("No image yet")}
            maxWidth={1200}
            onChange={(src) => onChange({ ...block, src })}
          />
          <Field
            label={t("Alt text")}
            hint={t("Read aloud by screen readers and shown when images are blocked.")}
            value={block.alt}
            onChange={(alt) => onChange({ ...block, alt })}
          />
          <Field label={t("Link (optional)")} value={block.href} onChange={(href) => onChange({ ...block, href })} />
          <Field label={t("Caption (optional)")} value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
        </div>
      )
    case 'button':
      return (
        <div className="grid gap-3">
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label={t("Button label")} value={block.label} onChange={(label) => onChange({ ...block, label })} />
            <Field label={t("Button link")} value={block.url} onChange={(url) => onChange({ ...block, url })} />
          </Cols>
          <div>
            <span className="mb-1 block text-[12px] font-medium text-muted">{t("Button colour")}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                aria-pressed={!block.color}
                onClick={() => onChange({ ...block, color: '' })}
                className={
                  'flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] ring-inset ' +
                  (!block.color ? 'font-semibold ring-2 ring-forest' : 'ring-1 ring-line-strong hover:bg-fill')
                }
              >
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: accent }} />
                {t("Accent")}</button>
              {BUTTON_COLORS.map(([color, label]) => (
                <button
                  key={color}
                  type="button"
                  title={t(label)}
                  aria-label={t('{label} button', { label: t(label) })}
                  aria-pressed={block.color === color}
                  onClick={() => onChange({ ...block, color })}
                  className={
                    'h-7 w-7 rounded-full ring-inset transition-shadow ' +
                    (block.color === color ? 'ring-2 ring-forest' : 'ring-1 ring-line-strong')
                  }
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          {block.color ? (
            <ColorField label={t("Custom colour")} value={block.color} onChange={(color) => onChange({ ...block, color })} />
          ) : null}
          <Segmented
            label={t("Position")}
            value={block.align}
            options={ALIGNS}
            onChange={(align) => onChange({ ...block, align: align as Align })}
          />
        </div>
      )
    case 'card':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <ColorField label={t("Card colour")} value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <OptionalColor
              label={t("Border")}
              value={block.border}
              fallback="#D4EC8E"
              onChange={(border) => onChange({ ...block, border })}
            />
          </Cols>
          <BlockList
            blocks={block.items}
            kinds={CARD_KINDS}
            accent={accent}
            owner={t('Card {n}', { n: index + 1 })}
            onChange={(items) => onChange({ ...block, items: items as InnerBlock[] })}
          />
          {cardActions ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <button type="button" className="ui-btn ui-btn-ghost min-h-8 gap-1.5 px-3 py-1 text-[13px]" onClick={cardActions.addLike}>
                <span className="text-forest">
                  <IconPlus />
                </span>
                {t("Add a card like this")}</button>
              {cardActions.cardCount > 1 ? (
                <button
                  type="button"
                  className="text-[12px] font-semibold text-forest hover:text-forest-deep hover:underline"
                  onClick={cardActions.styleAll}
                  title={t("Give every card in this email this card colour and border")}
                >
                  {t('Use this style for all {n} cards', { n: cardActions.cardCount })}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )
    case 'media':
      return (
        <div className="grid gap-3">
          <ImageField
            label={t("Picture")}
            hint={t("Shown on the left, e.g. a badge or logo.")}
            value={block.src}
            fallbackLabel={t("No picture yet")}
            maxWidth={400}
            onChange={(src) => onChange({ ...block, src })}
          />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label={t("Picture alt text")} value={block.alt} onChange={(alt) => onChange({ ...block, alt })} />
            <Segmented
              label={t("Picture width")}
              value={String(block.imageWidth)}
              options={[
                ['120', 'S'],
                ['160', 'M'],
                ['200', 'L'],
              ]}
              onChange={(width) => onChange({ ...block, imageWidth: Number(width) })}
            />
          </Cols>
          <RichTextEditor
            label={name}
            placeholder={t("Text beside the picture, e.g. a short intro and a list.")}
            value={block.html}
            onChange={(html) => onChange({ ...block, html })}
            minHeight={88}
          />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <ColorField label={t("Row colour")} value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <OptionalColor label={t("Border")} value={block.border} fallback="#07641D" onChange={(border) => onChange({ ...block, border })} />
          </Cols>
        </div>
      )
    case 'section':
      return (
        <div className="grid gap-3">
          <RichTextEditor
            label={name}
            placeholder={t("e.g. What’s coming next, with a heading and a list.")}
            value={block.html}
            onChange={(html) => onChange({ ...block, html })}
          />
          <Cols className="gap-3 @[24rem]:grid-cols-3">
            <ColorField label={t("Band colour")} value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <ColorField label={t("Text")} value={block.text} onChange={(text) => onChange({ ...block, text })} />
            <ColorField label={t("Links")} value={block.link} onChange={(link) => onChange({ ...block, link })} />
          </Cols>
        </div>
      )
    case 'event':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Field label={t("Title")} value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label={t("Date")} value={block.date} onChange={(date) => onChange({ ...block, date })} />
            <Field label={t("Time")} value={block.time} onChange={(time) => onChange({ ...block, time })} />
          </Cols>
          <Field label={t("Where")} hint={t("A venue, city, or “Microsoft Teams (online)”.")} value={block.location} onChange={(location) => onChange({ ...block, location })} />
          <div>
            <span className="mb-1 block text-[12px] font-medium text-muted">{t("Details")}</span>
            <RichTextEditor
              label={t('{name} details', { name })}
              placeholder={t("What the event covers, who should attend…")}
              value={block.html}
              onChange={(html) => onChange({ ...block, html })}
              minHeight={72}
            />
          </div>
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label={t("Button label")} value={block.buttonLabel} onChange={(buttonLabel) => onChange({ ...block, buttonLabel })} />
            <Field label={t("Button link")} value={block.buttonUrl} onChange={(buttonUrl) => onChange({ ...block, buttonUrl })} />
          </Cols>
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <ColorField label={t("Card colour")} value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <AutoColor
              label={t("Title and button colour")}
              autoLabel={t("Accent")}
              autoSwatch={accent}
              value={block.accent}
              fallback={accent}
              onChange={(value) => onChange({ ...block, accent: value })}
            />
          </Cols>
        </div>
      )
    case 'table':
      return <TableEditor block={block} name={name} onChange={onChange} />
    case 'spotlights':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <ol className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
            {block.cards.map((card, cardIndex) => {
              const setCard = (patch: Partial<typeof card>) =>
                onChange({ ...block, cards: block.cards.map((item) => (item.id === card.id ? { ...item, ...patch } : item)) })
              return (
                <li key={card.id} className="grid min-w-0 gap-3 rounded-[var(--r-md)] border border-line bg-panel p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink-2">{t('Card {n}', { n: cardIndex + 1 })}</span>
                    {block.cards.length > 1 ? (
                      <IconButton
                        label={t('Remove card {n}', { n: cardIndex + 1 })}
                        danger
                        onClick={() => onChange({ ...block, cards: block.cards.filter((item) => item.id !== card.id) })}
                      >
                        <IconTrash />
                      </IconButton>
                    ) : null}
                  </div>
                  <ImageField
                    label={t("Image (optional)")}
                    hint={t("Shown at the top of the card.")}
                    value={card.image}
                    fallbackLabel={t("No image")}
                    maxWidth={600}
                    onChange={(image) => setCard({ image })}
                  />
                  <Field label={t("Title")} value={card.title} onChange={(title) => setCard({ title })} />
                  <RichTextEditor
                    compact
                    label={t('{name} card {n} text', { name, n: cardIndex + 1 })}
                    placeholder={t("A sentence or two about this item.")}
                    value={card.html}
                    onChange={(html) => setCard({ html })}
                    minHeight={64}
                  />
                  <Cols className="gap-3 @[22rem]:grid-cols-2">
                    <Field label={t("Link label")} value={card.linkLabel} onChange={(linkLabel) => setCard({ linkLabel })} />
                    <Field label={t("Link")} value={card.linkUrl} onChange={(linkUrl) => setCard({ linkUrl })} />
                  </Cols>
                </li>
              )
            })}
          </ol>
          {block.cards.length < 3 ? (
            <button
              type="button"
              className="ui-btn ui-btn-ghost min-h-8 gap-1.5 justify-self-start px-3 py-1 text-[13px]"
              onClick={() => onChange({ ...block, cards: [...block.cards, newSpotlight()] })}
            >
              <span className="text-forest">
                <IconPlus />
              </span>
              {t("Add a card")}</button>
          ) : (
            <p className="text-[12px] text-muted">{t("Up to three cards fit side by side.")}</p>
          )}
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <ColorField label={t("Card colour")} value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <OptionalColor label={t("Border")} value={block.border} fallback="#E0E0E0" onChange={(border) => onChange({ ...block, border })} />
          </Cols>
        </div>
      )
    case 'signature':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Field label={t("Sign-off")} hint={t("e.g. Thanks, or Best regards,")} value={block.signoff} onChange={(signoff) => onChange({ ...block, signoff })} />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label={t("Name")} value={block.name} onChange={(value) => onChange({ ...block, name: value })} />
            <Field label={t("Role")} value={block.role} onChange={(role) => onChange({ ...block, role })} />
          </Cols>
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label={t("Team")} value={block.team} onChange={(team) => onChange({ ...block, team })} />
            <Field label={t("Email")} value={block.email} onChange={(email) => onChange({ ...block, email })} />
          </Cols>
          <ImageField
            label={t("Photo (optional)")}
            hint={t("A square headshot works best. Shown round, 64px.")}
            value={block.photo}
            fallbackLabel={t("No photo")}
            maxWidth={192}
            onChange={(photo) => onChange({ ...block, photo })}
          />
        </div>
      )
    case 'heading':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Field label={t("Heading")} value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <Segmented
            label={t("Size")}
            value={String(block.size)}
            options={[
              ['16', '16'],
              ['18', '18'],
              ['20', '20'],
              ['24', '24'],
              ['28', '28'],
            ]}
            onChange={(size) => onChange({ ...block, size: Number(size) })}
          />
          <Segmented
            label={t("Style")}
            value={block.fill ? 'bar' : block.outline ? 'outline' : 'plain'}
            options={[
              ['plain', t("Plain")],
              ['bar', t("Filled bar")],
              ['outline', t("Outlined")],
            ]}
            onChange={(style) =>
              onChange({
                ...block,
                fill: style === 'bar' ? block.fill || '#008575' : '',
                outline: style === 'outline' ? block.outline || '#008575' : '',
              })
            }
          />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <AutoColor
              label={t("Heading colour")}
              autoLabel={t("Automatic")}
              autoSwatch={block.fill ? readableOn(block.fill) : accent}
              value={block.color}
              fallback={accent}
              onChange={(color) => onChange({ ...block, color })}
            />
            {block.fill ? (
              <ColorField label={t("Bar colour")} value={block.fill} onChange={(fill) => onChange({ ...block, fill })} />
            ) : block.outline ? (
              <ColorField label={t("Outline colour")} value={block.outline} onChange={(outline) => onChange({ ...block, outline })} />
            ) : (
              <OptionalColor label={t("Line under it")} value={block.rule} fallback="#0078D4" onChange={(rule) => onChange({ ...block, rule })} />
            )}
          </Cols>
        </div>
      )
    case 'stats':
      return <StatsEditor block={block} onChange={onChange} />
    case 'columns':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <ItemList
            items={block.columns}
            noun="column"
            max={3}
            min={1}
            onChange={(columns) => onChange({ ...block, columns })}
            make={() => newTextColumn()}
            render={(column, set, i) => (
              <>
                <Field label={t("Title")} value={column.title} onChange={(title) => set({ title })} />
                <RichTextEditor
                  compact
                  label={t('{name} column {n} text', { name, n: i + 1 })}
                  placeholder={t("Bullets or a short paragraph.")}
                  value={column.html}
                  onChange={(html) => set({ html })}
                  minHeight={72}
                />
                <Cols className="gap-3 @[22rem]:grid-cols-2">
                  <OptionalColor
                    label={t("Title bar")}
                    value={column.headerBackground}
                    fallback="#E2EFD9"
                    onChange={(headerBackground) => set({ headerBackground })}
                  />
                  <ColorField label={t("Title colour")} value={column.headerText} onChange={(headerText) => set({ headerText })} />
                </Cols>
              </>
            )}
          />
        </div>
      )
    case 'gallery':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Segmented
            label={t("Photos per row")}
            value={String(block.columns)}
            options={[
              ['2', '2'],
              ['3', '3'],
            ]}
            onChange={(columns) => onChange({ ...block, columns: Number(columns) })}
          />
          <ItemList
            items={block.images}
            noun="photo"
            max={12}
            min={1}
            onChange={(images) => onChange({ ...block, images })}
            make={() => newGalleryImage()}
            render={(image, set) => (
              <>
                <ImageField label={t("Photo")} hint={t("JPG or PNG. Landscape photos line up best.")} value={image.src} fallbackLabel={t("No photo yet")} maxWidth={800} onChange={(src) => set({ src })} />
                <Field label={t("Alt text")} value={image.alt} onChange={(alt) => set({ alt })} />
              </>
            )}
          />
        </div>
      )
    case 'people':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Cols className="gap-3 @[22rem]:grid-cols-[1fr_auto]">
            <Field label={t("Group title (optional)")} hint={t("e.g. Microsoft Sponsors")} value={block.title} onChange={(title) => onChange({ ...block, title })} />
            <Segmented
              label={t("Per row")}
              value={String(block.columns)}
              options={[
                ['2', '2'],
                ['3', '3'],
              ]}
              onChange={(columns) => onChange({ ...block, columns: Number(columns) })}
            />
          </Cols>
          <OptionalColor label={t("Title bar")} value={block.headerBackground} fallback="#E2EFD9" onChange={(headerBackground) => onChange({ ...block, headerBackground })} />
          <ItemList
            items={block.people}
            noun="person"
            max={24}
            min={1}
            onChange={(people) => onChange({ ...block, people })}
            make={() => newPerson()}
            render={(person, set) => (
              <>
                <Cols className="gap-3 @[22rem]:grid-cols-2">
                  <Field label={t("Name")} value={person.name} onChange={(value) => set({ name: value })} />
                  <Field label={t("Role")} value={person.role} onChange={(role) => set({ role })} />
                </Cols>
                <Field label={t("Detail (optional)")} hint={t("e.g. the accounts they cover")} value={person.detail} onChange={(detail) => set({ detail })} />
                <ImageField label={t("Photo (optional)")} hint={t("Square headshot, shown round. Without one, initials show.")} value={person.photo} fallbackLabel={t("Initials")} maxWidth={144} onChange={(photo) => set({ photo })} />
              </>
            )}
          />
        </div>
      )
    case 'details':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Field label={t("Box title")} hint={t("e.g. Your Login Credentials. Leave empty for none.")} value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <div className="grid gap-2" role="group" aria-label={t('{name} rows', { name })}>
            {block.rows.map((row, rowIndex) => {
              const setRow = (patch: Partial<typeof row>) =>
                onChange({ ...block, rows: block.rows.map((item) => (item.id === row.id ? { ...item, ...patch } : item)) })
              return (
                <div key={row.id} className="grid min-w-0 gap-1.5 rounded-[var(--r-md)] border border-line bg-panel p-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <input
                      value={row.label}
                      aria-label={t('Row {n} label', { n: rowIndex + 1 })}
                      placeholder={t("Label")}
                      onChange={(event) => setRow({ label: event.target.value })}
                      className="ui-field ui-field-sm w-[36%] min-w-0 font-semibold"
                    />
                    <input
                      value={row.value}
                      aria-label={t('Row {n} value', { n: rowIndex + 1 })}
                      placeholder={t("Value or [placeholder]")}
                      onChange={(event) => setRow({ value: event.target.value })}
                      className="ui-field ui-field-sm min-w-0 flex-1"
                    />
                    <IconButton
                      label={t('Remove row {n}', { n: rowIndex + 1 })}
                      danger
                      onClick={() => onChange({ ...block, rows: block.rows.filter((item) => item.id !== row.id) })}
                    >
                      <IconTrash />
                    </IconButton>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <input
                      value={row.note}
                      aria-label={t('Row {n} note', { n: rowIndex + 1 })}
                      placeholder={t("Note (optional), e.g. (Temporary password)")}
                      onChange={(event) => setRow({ note: event.target.value })}
                      className="ui-field ui-field-sm min-w-0 flex-1 basis-40"
                    />
                    <Toggle label={t("Bold value")} checked={row.strong} onChange={(strong) => setRow({ strong })} />
                  </div>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            className="ui-btn ui-btn-ghost min-h-8 gap-1.5 justify-self-start px-3 py-1 text-[13px]"
            onClick={() => onChange({ ...block, rows: [...block.rows, newDetailRow()] })}
          >
            <span className="text-forest">
              <IconPlus />
            </span>
            {t("Add a row")}</button>
          <p className="-mt-1 text-[11px] text-muted">{t("Email addresses and web addresses become links automatically.")}</p>
          <Cols className="gap-3 @[24rem]:grid-cols-3">
            <ColorField label={t("Label colour")} value={block.labelColor} onChange={(labelColor) => onChange({ ...block, labelColor })} />
            <ColorField label={t("Box colour")} value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <AutoColor
              label={t("Left bar")}
              autoLabel={t("Link colour")}
              autoSwatch="#0078D4"
              value={block.accent}
              fallback="#0078D4"
              onChange={(value) => onChange({ ...block, accent: value })}
            />
          </Cols>
        </div>
      )
    default:
      return <p className="text-[12px] text-muted">{t("A thin grey line that separates two parts of the newsletter.")}</p>
  }
}

/** Grid of cells for a table block, with rows and columns you can add and remove. */
function TableEditor({
  block,
  name,
  onChange,
}: {
  block: Extract<BodyBlock, { kind: 'table' }>
  name: string
  onChange: (block: BodyBlock) => void
}) {
  const columns = Math.max(1, block.rows[0]?.length ?? 3)
  const setRows = (rows: string[][]) => onChange({ ...block, rows })
  const setCell = (r: number, c: number, value: string) =>
    setRows(block.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row)))
  const setColumns = (count: number) =>
    setRows(block.rows.map((row) => Array.from({ length: count }, (_, i) => row[i] ?? '')))
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <Field label={t("Title (optional)")} hint={t("Shown above the table, e.g. Agenda.")} value={block.title} onChange={(title) => onChange({ ...block, title })} />
      <Cols className="gap-3 @[22rem]:grid-cols-[auto_1fr]">
        <Segmented
          label={t("Columns")}
          value={String(columns)}
          options={[
            ['2', '2'],
            ['3', '3'],
            ['4', '4'],
            ['5', '5'],
            ['6', '6'],
          ]}
          onChange={(count) => setColumns(Number(count))}
        />
        <div className="flex flex-wrap items-end gap-x-4">
          <Toggle label={t("Header row")} checked={block.header} onChange={(header) => onChange({ ...block, header })} />
          {block.plain ? null : (
            <Toggle label={t("Striped rows")} checked={block.striped} onChange={(striped) => onChange({ ...block, striped })} />
          )}
          <Toggle label={t("Open style (no lines)")} checked={Boolean(block.plain)} onChange={(plain) => onChange({ ...block, plain })} />
        </div>
      </Cols>
      <p className="-mt-1 text-[12px] leading-4 text-muted">
        {t("To link a cell, write [link text](https://…). Web addresses become links on their own.")}</p>
      <div className="grid gap-1.5" role="group" aria-label={t('{name} cells', { name })}>
        {block.rows.map((row, r) => (
          <div key={r} className="flex min-w-0 items-center gap-1.5">
            <div className="grid min-w-0 flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {row.map((cell, c) => (
                <input
                  key={c}
                  value={cell}
                  aria-label={block.header && r === 0 ? t('Header, column {c}', { c: c + 1 }) : t('Row {n}, column {c}', { n: block.header ? r : r + 1, c: c + 1 })}
                  placeholder={block.header && r === 0 ? t("Heading") : ''}
                  onChange={(event) => setCell(r, c, event.target.value)}
                  className={'ui-field ui-field-sm min-w-0 ' + (block.header && r === 0 ? 'font-semibold' : '')}
                />
              ))}
            </div>
            <IconButton
              label={block.header && r === 0 ? t('Remove header row') : t('Remove row {n}', { n: block.header ? r : r + 1 })}
              danger
              disabled={block.rows.length <= 1}
              onClick={() => setRows(block.rows.filter((_, ri) => ri !== r))}
            >
              <IconTrash />
            </IconButton>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="ui-btn ui-btn-ghost min-h-8 gap-1.5 justify-self-start px-3 py-1 text-[13px]"
        onClick={() => setRows([...block.rows, Array.from({ length: columns }, () => '')])}
      >
        <span className="text-forest">
          <IconPlus />
        </span>
        {t("Add a row")}</button>
      {block.plain ? (
        <ColorField label={t("Header text")} value={block.headerText} onChange={(headerText) => onChange({ ...block, headerText })} />
      ) : (
        <Cols className="gap-3 @[24rem]:grid-cols-3">
          <ColorField label={t("Header colour")} value={block.headerBackground} onChange={(headerBackground) => onChange({ ...block, headerBackground })} />
          <ColorField label={t("Header text")} value={block.headerText} onChange={(headerText) => onChange({ ...block, headerText })} />
          <ColorField label={t("Lines")} value={block.border} onChange={(border) => onChange({ ...block, border })} />
        </Cols>
      )}
    </div>
  )
}

/** Dark shades for callouts that carry white text. */
const CALLOUT_DARK = ['#0B4F38', '#194449', '#243A5E', '#5C2D91']

/** A colour with an automatic default (empty value), e.g. "Accent" or "Automatic". */
function AutoColor({
  label,
  autoLabel,
  autoSwatch,
  value,
  fallback,
  onChange,
}: {
  label: string
  autoLabel: string
  autoSwatch: string
  value: string
  fallback: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange('')}
          className={
            'flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] ring-inset ' +
            (!value ? 'font-semibold ring-2 ring-forest' : 'ring-1 ring-line-strong hover:bg-fill')
          }
        >
          <span className="h-3.5 w-3.5 rounded-full ring-1 ring-line-strong" style={{ background: autoSwatch }} />
          {autoLabel}
        </button>
        <button
          type="button"
          aria-pressed={Boolean(value)}
          onClick={() => onChange(value || fallback)}
          className={
            'h-7 rounded-full px-2.5 text-[12px] ring-inset ' +
            (value ? 'font-semibold ring-2 ring-forest' : 'ring-1 ring-line-strong hover:bg-fill')
          }
        >
          {t("Custom")}</button>
      </div>
      {value ? <ColorField label={t('{label} (custom)', { label })} value={value} onChange={onChange} /> : null}
    </div>
  )
}

/** A small preview of the callout's colours, so you can judge contrast as you pick. */
function CalloutSample({ block, accent }: { block: Extract<BodyBlock, { kind: 'callout' }>; accent: string }) {
  const ink = block.text || (readableOn(block.background) === '#FFFFFF' ? '#FFFFFF' : '#242424')
  return (
    <div aria-hidden="true" className="flex overflow-hidden rounded-[var(--r-sm)] ring-1 ring-line">
      {block.showRule ? <span className="w-1 shrink-0" style={{ background: block.rule || accent }} /> : null}
      <span className="min-w-0 flex-1 px-3 py-2 text-[13px] leading-5" style={{ background: block.background, color: ink }}>
        <strong>{t("Preview:")}</strong> {' '}{t("how the callout text reads on this shade.")}</span>
    </div>
  )
}

/** A colour that can be switched off (borders). */
export function OptionalColor({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string
  value: string
  fallback: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Toggle label={label} checked={Boolean(value)} onChange={(on) => onChange(on ? fallback : '')} />
      {value ? <ColorField label={t('{label} colour', { label })} value={value} onChange={onChange} /> : null}
    </div>
  )
}

export function FooterSection({ design, patch }: { design: NewsletterDesign; patch: Patch }) {
  const f = design.footer
  return (
    <Section title={t("Footer")} anchor="footer" noCopilot>
      <div>
        <span className="mb-1 block text-[12px] font-medium text-muted">{t("Footer message")}</span>
        <RichTextEditor
          compact
          label={t("Footer message")}
          placeholder={t("A sign-off, contact line, or why the reader receives this email.")}
          value={f.html}
          onChange={(html) => patch('footer', { html })}
          minHeight={72}
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12px] font-semibold">{t("Footer links")}</span>
          <button
            type="button"
            onClick={() => patch('footer', { links: [...f.links, newFooterLink()] })}
            className="text-[12px] font-semibold text-forest hover:text-forest-deep hover:underline"
          >
            {t("Add footer link")}</button>
        </div>
        {f.links.length === 0 ? <p className="text-[12px] text-muted">{t("No links. Privacy and unsubscribe links usually go here.")}</p> : null}
        <ul className="grid gap-2">
          {f.links.map((link, index) => (
            <li key={link.id} className="flex items-start gap-1.5">
              <input
                value={link.label}
                aria-label={t('Link {n} label', { n: index + 1 })}
                placeholder={t("Label")}
                onChange={(event) =>
                  patch('footer', { links: f.links.map((item) => (item.id === link.id ? { ...item, label: event.target.value } : item)) })
                }
                className="ui-field ui-field-sm w-[40%] min-w-0"
              />
              <input
                value={link.url}
                aria-label={t('Link {n} address', { n: index + 1 })}
                placeholder={t("https://")}
                onChange={(event) =>
                  patch('footer', { links: f.links.map((item) => (item.id === link.id ? { ...item, url: event.target.value } : item)) })
                }
                className="ui-field ui-field-sm min-w-0 flex-1"
              />
              <IconButton
                label={t('Remove link {n}', { n: index + 1 })}
                danger
                onClick={() => patch('footer', { links: f.links.filter((item) => item.id !== link.id) })}
              >
                <IconTrash />
              </IconButton>
            </li>
          ))}
        </ul>
      </div>
      <Toggle label={t("Show Microsoft logo")} checked={f.showMark} onChange={(showMark) => patch('footer', { showMark })} />
      {f.showMark ? (
        <ImageField
          label={t("Footer logo image (optional)")}
          hint={t("Replaces the four-square mark and wordmark. Shown 18px tall.")}
          value={f.logo}
          fallbackLabel={t("Four-square mark and “Microsoft”")}
          maxWidth={300}
          onChange={(logo) => patch('footer', { logo })}
        />
      ) : null}
      <Field
        label={t("Small print")}
        hint={t("Copyright and address. One line per line.")}
        multiline
        value={f.legal}
        onChange={(legal) => patch('footer', { legal })}
      />
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <ColorField label={t("Footer colour")} value={f.background} onChange={(background) => patch('footer', { background })} />
        <ColorField label={t("Footer text")} value={f.text} onChange={(text) => patch('footer', { text })} />
      </Cols>
    </Section>
  )
}

export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={'ui-icon-btn h-7 w-7 disabled:opacity-35 ' + (danger ? 'ui-icon-btn-danger' : '')}
    >
      {children}
    </button>
  )
}

export function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: [string, string][]
  onChange: (value: string) => void
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <span className="mb-1 block text-[12px] font-medium text-muted">{label}</span>
      <div className="inline-flex flex-wrap gap-0.5 rounded-[var(--r-sm)] bg-fill p-0.5">
        {options.map(([key, name]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            onClick={() => onChange(key)}
            className={
              'rounded-[5px] px-3 py-1 text-[13px] leading-5 transition-colors ' +
              (value === key ? 'bg-surface font-semibold text-ink shadow-[var(--elev-xs)]' : 'text-ink-2 hover:text-ink')
            }
          >
            {t(name)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 self-end pb-1.5 text-[13px] leading-5 text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--studio-forest)]"
      />
      {label}
    </label>
  )
}

const HEX = /^#[0-9a-f]{6}$/i

export function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [last, setLast] = useState(value)
  const palette = usePopover()
  const inputId = useId()
  // Follow outside changes (theme buttons, campaign switch).
  if (value !== last) {
    setLast(value)
    setDraft(value)
  }
  const named = paletteName(value)
  return (
    <div ref={palette.root} className="block min-w-0">
      <label htmlFor={inputId} className="mb-1 block text-[12px] font-medium text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="relative h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[var(--r-sm)] ring-1 ring-line-strong ring-inset" style={{ background: value }}>
          <input
            type="color"
            value={value}
            aria-label={t('{label} picker', { label })}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
          id={inputId}
          value={draft}
          aria-label={label}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.trim()
            setDraft(next)
            const hex = next.startsWith('#') ? next : `#${next}`
            if (HEX.test(hex)) onChange(hex.toUpperCase())
          }}
          onBlur={() => setDraft(value)}
          className="ui-field min-w-0 flex-1 font-mono text-[13px] uppercase"
        />
        <button
          ref={palette.trigger}
          type="button"
          aria-label={t('{label}: Microsoft palette', { label })}
          aria-expanded={palette.open}
          title={t("Microsoft palette")}
          onClick={() => palette.setOpen(!palette.open)}
          className={
            'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[var(--r-sm)] ring-1 ring-inset transition-colors hover:bg-fill ' +
            (palette.open ? 'bg-fill ring-forest' : 'ring-line-strong')
          }
        >
          <span aria-hidden="true" className="grid grid-cols-2 gap-[2px]">
            {['#225B62', '#49C5B1', '#0078D4', '#FFB900'].map((color) => (
              <span key={color} className="h-[7px] w-[7px] rounded-[1px]" style={{ background: color }} />
            ))}
          </span>
        </button>
      </div>
      {palette.open ? (
        // Opens in place under the field, so it fits however narrow the column is.
        <div role="dialog" aria-label={t("Microsoft palette")} className="mt-1.5 rounded-[var(--r-md)] border border-line bg-surface p-2.5">
          <PaletteGroup title={t("Primary")} colors={MS_PRIMARY} value={value} columns={5} onPick={(hex) => { onChange(hex); palette.close(true) }} />
          <PaletteGroup title={t("Secondary")} colors={MS_SECONDARY} value={value} columns={4} onPick={(hex) => { onChange(hex); palette.close(true) }} />
        </div>
      ) : null}
      {hint || named ? (
        <span className="mt-1 block text-[11px] text-muted">{[named ? t('Microsoft {name}', { name: t(named) }) : '', hint].filter(Boolean).join(' · ')}</span>
      ) : null}
    </div>
  )
}

function PaletteGroup({
  title,
  colors,
  value,
  columns,
  onPick,
}: {
  title: string
  colors: PaletteColor[]
  value: string
  columns: number
  onPick: (hex: string) => void
}) {
  return (
    <div className="mb-2 last:mb-0">
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</span>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {colors.map((color) => (
          <button
            key={color.hex}
            type="button"
            title={`${color.name} ${color.hex}`}
            aria-label={`${color.name} ${color.hex}`}
            aria-pressed={value.toUpperCase() === color.hex}
            onClick={() => onPick(color.hex)}
            className={
              'h-6 min-w-0 rounded-[var(--r-sm)] ring-inset transition-transform hover:scale-105 ' +
              (value.toUpperCase() === color.hex ? 'ring-2 ring-ink ring-offset-1' : 'ring-1 ring-line-strong')
            }
            style={{ background: color.hex }}
          />
        ))}
      </div>
    </div>
  )
}

/** A grid that switches to columns when the form pane is wide enough. */
export function Cols({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="min-w-0 @container">
      <div className={'grid grid-cols-[minmax(0,1fr)] ' + className}>{children}</div>
    </div>
  )
}

/** A list of items (columns, photos, people) with add, move, and remove. */
function ItemList<T extends { id: string }>({
  items,
  noun,
  max,
  min,
  onChange,
  make,
  render,
}: {
  items: T[]
  noun: string
  max: number
  min: number
  onChange: (items: T[]) => void
  make: () => T
  render: (item: T, set: (patch: Partial<T>) => void, index: number) => ReactNode
}) {
  const Noun = noun[0].toUpperCase() + noun.slice(1)
  const move = (index: number, by: -1 | 1) => {
    const target = index + by
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2.5">
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
        {items.map((item, index) => {
          const set = (patch: Partial<T>) => onChange(items.map((other) => (other.id === item.id ? { ...other, ...patch } : other)))
          return (
            <li key={item.id} className="grid min-w-0 gap-3 rounded-[var(--r-md)] border border-line bg-panel p-3">
              <div className="flex items-center gap-0.5">
                <span className="min-w-0 flex-1 text-[12px] font-semibold text-ink-2">
                  {Noun} {index + 1}
                </span>
                <IconButton label={t(`Move ${noun} {n} up`, { n: index + 1 })} disabled={index === 0} onClick={() => move(index, -1)}>
                  <IconChevron className="rotate-180" />
                </IconButton>
                <IconButton label={t(`Move ${noun} {n} down`, { n: index + 1 })} disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                  <IconChevron />
                </IconButton>
                <IconButton
                  label={t(`Remove ${noun} {n}`, { n: index + 1 })}
                  danger
                  disabled={items.length <= min}
                  onClick={() => onChange(items.filter((other) => other.id !== item.id))}
                >
                  <IconTrash />
                </IconButton>
              </div>
              {render(item, set, index)}
            </li>
          )
        })}
      </ol>
      {items.length < max ? (
        <button
          type="button"
          className="ui-btn ui-btn-ghost min-h-8 gap-1.5 justify-self-start px-3 py-1 text-[13px]"
          onClick={() => onChange([...items, make()])}
        >
          <span className="text-forest">
            <IconPlus />
          </span>
          {t(`Add a ${noun}`)}
        </button>
      ) : null}
    </div>
  )
}

/** Number tiles: an optional label tile, then value/label tiles with their own colours. */
function StatsEditor({ block, onChange }: { block: Extract<BodyBlock, { kind: 'stats' }>; onChange: (block: BodyBlock) => void }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <div className="grid min-w-0 gap-3 rounded-[var(--r-md)] border border-line bg-panel p-3">
        <span className="text-[12px] font-semibold text-ink-2">{t("Label tile (optional, shown first)")}</span>
        <Cols className="gap-3 @[22rem]:grid-cols-2">
          <Field label={t("Title")} hint={t("e.g. Partner Mix")} value={block.leadTitle} onChange={(leadTitle) => onChange({ ...block, leadTitle })} />
          <Field label={t("Caption")} hint={t("e.g. (Private 1:1 Events)")} value={block.leadCaption} onChange={(leadCaption) => onChange({ ...block, leadCaption })} />
        </Cols>
        {block.leadTitle.trim() ? (
          <ColorField label={t("Label tile colour")} value={block.leadBackground} onChange={(leadBackground) => onChange({ ...block, leadBackground })} />
        ) : null}
      </div>
      <ItemList
        items={block.tiles}
        noun="tile"
        max={8}
        min={1}
        onChange={(tiles) => onChange({ ...block, tiles })}
        make={() => newStatTile()}
        render={(tile, set) => (
          <>
            <Cols className="gap-3 @[22rem]:grid-cols-[1fr_2fr]">
              <Field label={t("Number")} value={tile.value} onChange={(value) => set({ value })} />
              <Field label={t("Label")} value={tile.label} onChange={(label) => set({ label })} />
            </Cols>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] font-medium text-muted">{t("Tile colour")}</span>
              {[
                ['#02AE68', '#FFFFFF'],
                ['#FCFC92', '#1B1B1B'],
                ['#E2EFD9', '#1B1B1B'],
                ['#C3DEB0', '#1B1B1B'],
                ['#008575', '#FFFFFF'],
                ['#F2F2F2', '#1B1B1B'],
              ].map(([background, text]) => (
                <button
                  key={background}
                  type="button"
                  aria-label={t('Tile colour {color}', { color: background })}
                  aria-pressed={tile.background === background}
                  onClick={() => set({ background, text })}
                  className={'h-6 w-6 rounded-full ring-inset ' + (tile.background === background ? 'ring-2 ring-forest' : 'ring-1 ring-line-strong')}
                  style={{ background }}
                />
              ))}
            </div>
            <Cols className="gap-3 @[22rem]:grid-cols-2">
              <ColorField label={t("Tile colour (custom)")} value={tile.background} onChange={(background) => set({ background })} />
              <ColorField label={t("Number colour")} value={tile.text} onChange={(text) => set({ text })} />
            </Cols>
          </>
        )}
      />
    </div>
  )
}
