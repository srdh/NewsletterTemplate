import { useMemo, useState, type ReactNode } from 'react'
import {
  CALLOUT_COLORS,
  THEMES,
  WIDTHS,
  cloneBlock,
  newBlock,
  newFooterLink,
  newSpotlight,
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

export const KIND_LABEL: Record<BlockKind, string> = {
  text: 'Text',
  callout: 'Callout',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
  card: 'Card',
  media: 'Image + text',
  section: 'Colour band',
  event: 'Event card',
  table: 'Table',
  spotlights: 'Spotlight cards',
  signature: 'Signature',
}

export const KIND_HINT: Record<BlockKind, string> = {
  text: 'Paragraphs, headings, lists, links',
  callout: 'Shaded box for an action or note',
  image: 'Full-width picture, optional link',
  button: 'Call-to-action button',
  divider: 'Thin line between sections',
  card: 'Bordered box that holds its own text, buttons, and images',
  media: 'Picture beside rich text, e.g. a badge and its list',
  section: 'Full-width coloured band with its own text colour',
  event: 'Date, time, place, details, and a button',
  table: 'Rows and columns, with an optional header row',
  spotlights: 'Two or three cards side by side',
  signature: 'Sign-off with name, role, team, and email',
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
    <Section title="Style" anchor="style" noCopilot>
      <div>
        <span className="mb-1.5 block text-[12px] font-medium text-muted">Theme</span>
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
          label="Accent colour"
          hint="Headings, buttons, and the callout rule."
          value={design.style.accent}
          onChange={(accent) => patch('style', { accent })}
        />
        <ColorField
          label="Link colour"
          hint="Links in the body and cards."
          value={design.style.link}
          onChange={(link) => patch('style', { link })}
        />
      </Cols>
      <Cols className="gap-3.5 @[22rem]:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-muted">Font</span>
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
          <span className="mt-1 block text-[11px] text-muted">For the whole email. Change single words with the toolbar.</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-muted">Text size</span>
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
        label="Email width"
        value={String(design.style.width)}
        options={WIDTHS.map((w) => [String(w), `${w}px`])}
        onChange={(width) => patch('style', { width: Number(width) })}
      />
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <ColorField
          label="Email body colour"
          value={design.style.paper}
          onChange={(paper) => patch('style', { paper })}
        />
        <ColorField
          label="Around the email"
          value={design.style.canvas}
          onChange={(canvas) => patch('style', { canvas })}
        />
      </Cols>
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
    <Section title="Banner" anchor="banner">
      <Segmented
        label="Layout"
        value={b.layout}
        options={LAYOUTS}
        onChange={(layout) => patch('banner', { layout: layout as BannerLayout })}
      />
      {needsImage ? (
        <ImageField
          label={b.layout === 'image' ? 'Banner image' : 'Banner art'}
          hint={
            b.layout === 'image'
              ? 'Shown edge to edge at the top. A wide image with the headline in it works well (about 1280 × 720).'
              : 'Shown to the right of the headline. Transparent PNGs work best.'
          }
          value={campaign.banner_image ?? ''}
          fallbackLabel="No image yet. The banner shows as a colour band until you add one."
          maxWidth={b.layout === 'image' ? 1440 : 400}
          onChange={(banner_image) => set({ banner_image })}
        />
      ) : null}
      {b.layout === 'image' ? (
        <Field
          label="Banner image alt text"
          hint="Say what the picture says, for screen readers and blocked images."
          value={b.imageAlt}
          onChange={(imageAlt) => patch('banner', { imageAlt })}
        />
      ) : null}
      <Field label="Eyebrow" hint="Small line above the headline." value={campaign.kicker} onChange={(kicker) => set({ kicker })} />
      <Field
        label="Headline"
        hint={b.layout === 'image' ? 'Optional with a full image: leave empty when the image carries the headline.' : undefined}
        value={campaign.title}
        onChange={(title) => set({ title })}
      />
      <Field label="Subheadline" value={campaign.subtitle} onChange={(subtitle) => set({ subtitle })} />
      <Segmented
        label="Text alignment"
        value={b.align}
        options={ALIGNS}
        onChange={(align) => patch('banner', { align: align as Align })}
      />
      <Subheading>Logo row</Subheading>
      <Cols className="gap-3.5 @[22rem]:grid-cols-[1fr_auto]">
        <Field
          label="Date label"
          hint="Right side of the logo row, e.g. November 2026."
          value={b.dateLabel}
          onChange={(dateLabel) => patch('banner', { dateLabel })}
        />
        <Toggle label="Microsoft logo" checked={b.showMark} onChange={(showMark) => patch('banner', { showMark })} />
      </Cols>
      {b.showMark ? (
        <ImageField
          label="Logo image (optional)"
          hint="Replaces the four-square mark, e.g. the full Microsoft logo. Shown 30px tall."
          value={b.logo}
          fallbackLabel="Four-square mark"
          maxWidth={480}
          onChange={(logo) => patch('banner', { logo })}
        />
      ) : null}
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <ColorField label="Banner colour" value={b.background} onChange={(background) => patch('banner', { background })} />
        <ColorField label="Banner text" value={b.text} onChange={(text) => patch('banner', { text })} />
      </Cols>
      <Subheading>Banner button (optional)</Subheading>
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <Field label="Button label" value={campaign.register_label} onChange={(register_label) => set({ register_label })} />
        <Field label="Button link" value={campaign.register_url} onChange={(register_url) => set({ register_url })} />
      </Cols>
    </Section>
  )
}

function BodySection({ design, save }: { design: NewsletterDesign; save: (next: NewsletterDesign) => void }) {
  return (
    <Section title="Body" anchor="body" noCopilot>
      <p className="-mt-2 text-[12px] leading-4 text-muted">
        The newsletter body is a stack of blocks. Write in text blocks with the toolbar (headings, bold, colour, lists,
        links). Cards group text and buttons in a bordered box; colour bands span the full width.
      </p>
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
          {nested ? 'This card is empty. Add a text block or a button.' : 'No blocks yet. Add a text block to start writing.'}
        </p>
      ) : null}
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
        {blocks.map((block, index) => {
          const open = !closedIds.has(block.id)
          const update = (next: BodyBlock) => onChange(blocks.map((item) => (item.id === block.id ? next : item)))
          const name = nested ? `${owner} · ${KIND_LABEL[block.kind].toLowerCase()} ${index + 1}` : `${KIND_LABEL[block.kind]} block ${index + 1}`
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
                <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                  <IconChevron className="rotate-180" />
                </IconButton>
                <IconButton label="Move down" disabled={index === blocks.length - 1} onClick={() => move(index, 1)}>
                  <IconChevron />
                </IconButton>
                <IconButton
                  label="Duplicate block"
                  onClick={() => onChange([...blocks.slice(0, index + 1), cloneBlock(block), ...blocks.slice(index + 1)])}
                >
                  <IconDuplicate />
                </IconButton>
                <IconButton
                  label="Delete block"
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
        <p className="px-1 pb-1.5 text-[12px] font-semibold leading-4 text-ink-2">{nested ? `Add to ${owner}` : 'Add a block'}</p>
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
      return isRichEmpty(block.html) ? 'Empty' : plain(block.html)
    case 'media':
      return isRichEmpty(block.html) ? (block.src ? 'Image, no text yet' : 'Empty') : plain(block.html)
    case 'card': {
      const first = block.items.find((item) => item.kind === 'text' && !isRichEmpty(item.html))
      const count = `${block.items.length} item${block.items.length === 1 ? '' : 's'}`
      return first && first.kind === 'text' ? `${plain(first.html)} · ${count}` : count
    }
    case 'image':
      return block.src ? block.alt || block.caption || 'Image added' : 'No image yet'
    case 'button':
      return block.label || 'No label'
    case 'event':
      return block.title || [block.date, block.time].filter(Boolean).join(' · ') || 'Event details'
    case 'table': {
      const rows = block.rows.length - (block.header ? 1 : 0)
      return `${rows} row${rows === 1 ? '' : 's'}${block.title ? ` · ${block.title}` : ''}`
    }
    case 'spotlights':
      return `${block.cards.length} card${block.cards.length === 1 ? '' : 's'}`
    case 'signature':
      return [block.name, block.team].filter(Boolean).join(', ') || 'No name yet'
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
          placeholder="Write a paragraph, add a heading, or paste from Word…"
          value={block.html}
          onChange={(html) => onChange({ ...block, html })}
        />
      )
    case 'callout':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <div>
            <span className="mb-1 block text-[12px] font-medium text-muted">Shade</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[...CALLOUT_COLORS, ...CALLOUT_DARK].map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Shade ${color}`}
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
          <ColorField label="Shade colour" value={block.background} onChange={(background) => onChange({ ...block, background })} />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <div className="grid gap-1.5">
              <Toggle label="Left rule" checked={block.showRule} onChange={(showRule) => onChange({ ...block, showRule })} />
              {block.showRule ? (
                <AutoColor
                  label="Rule colour"
                  autoLabel="Accent"
                  autoSwatch={accent}
                  value={block.rule}
                  fallback={accent}
                  onChange={(rule) => onChange({ ...block, rule })}
                />
              ) : null}
            </div>
            <AutoColor
              label="Text colour"
              autoLabel="Automatic"
              autoSwatch={readableOn(block.background) === '#FFFFFF' ? '#FFFFFF' : '#242424'}
              value={block.text}
              fallback="#242424"
              onChange={(text) => onChange({ ...block, text })}
            />
          </Cols>
          <CalloutSample block={block} accent={accent} />
          <RichTextEditor
            compact
            label={name}
            placeholder="e.g. Action: invite your partners to register before Friday."
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
            label="Image"
            hint="Shown at full width. PNG, JPG, GIF, or WebP."
            value={block.src}
            fallbackLabel="No image yet"
            maxWidth={1200}
            onChange={(src) => onChange({ ...block, src })}
          />
          <Field
            label="Alt text"
            hint="Read aloud by screen readers and shown when images are blocked."
            value={block.alt}
            onChange={(alt) => onChange({ ...block, alt })}
          />
          <Field label="Link (optional)" value={block.href} onChange={(href) => onChange({ ...block, href })} />
          <Field label="Caption (optional)" value={block.caption} onChange={(caption) => onChange({ ...block, caption })} />
        </div>
      )
    case 'button':
      return (
        <div className="grid gap-3">
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label="Button label" value={block.label} onChange={(label) => onChange({ ...block, label })} />
            <Field label="Button link" value={block.url} onChange={(url) => onChange({ ...block, url })} />
          </Cols>
          <div>
            <span className="mb-1 block text-[12px] font-medium text-muted">Button colour</span>
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
                Accent
              </button>
              {BUTTON_COLORS.map(([color, label]) => (
                <button
                  key={color}
                  type="button"
                  title={label}
                  aria-label={`${label} button`}
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
            <ColorField label="Custom colour" value={block.color} onChange={(color) => onChange({ ...block, color })} />
          ) : null}
          <Segmented
            label="Position"
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
            <ColorField label="Card colour" value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <OptionalColor
              label="Border"
              value={block.border}
              fallback="#D4EC8E"
              onChange={(border) => onChange({ ...block, border })}
            />
          </Cols>
          <BlockList
            blocks={block.items}
            kinds={CARD_KINDS}
            accent={accent}
            owner={`Card ${index + 1}`}
            onChange={(items) => onChange({ ...block, items: items as InnerBlock[] })}
          />
          {cardActions ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <button type="button" className="ui-btn ui-btn-ghost min-h-8 gap-1.5 px-3 py-1 text-[13px]" onClick={cardActions.addLike}>
                <span className="text-forest">
                  <IconPlus />
                </span>
                Add a card like this
              </button>
              {cardActions.cardCount > 1 ? (
                <button
                  type="button"
                  className="text-[12px] font-semibold text-forest hover:text-forest-deep hover:underline"
                  onClick={cardActions.styleAll}
                  title="Give every card in this email this card colour and border"
                >
                  Use this style for all {cardActions.cardCount} cards
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
            label="Picture"
            hint="Shown on the left, e.g. a badge or logo."
            value={block.src}
            fallbackLabel="No picture yet"
            maxWidth={400}
            onChange={(src) => onChange({ ...block, src })}
          />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label="Picture alt text" value={block.alt} onChange={(alt) => onChange({ ...block, alt })} />
            <Segmented
              label="Picture width"
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
            placeholder="Text beside the picture, e.g. a short intro and a list."
            value={block.html}
            onChange={(html) => onChange({ ...block, html })}
            minHeight={88}
          />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <ColorField label="Row colour" value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <OptionalColor label="Border" value={block.border} fallback="#07641D" onChange={(border) => onChange({ ...block, border })} />
          </Cols>
        </div>
      )
    case 'section':
      return (
        <div className="grid gap-3">
          <RichTextEditor
            label={name}
            placeholder="e.g. What’s coming next, with a heading and a list."
            value={block.html}
            onChange={(html) => onChange({ ...block, html })}
          />
          <Cols className="gap-3 @[24rem]:grid-cols-3">
            <ColorField label="Band colour" value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <ColorField label="Text" value={block.text} onChange={(text) => onChange({ ...block, text })} />
            <ColorField label="Links" value={block.link} onChange={(link) => onChange({ ...block, link })} />
          </Cols>
        </div>
      )
    case 'event':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Field label="Title" value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label="Date" value={block.date} onChange={(date) => onChange({ ...block, date })} />
            <Field label="Time" value={block.time} onChange={(time) => onChange({ ...block, time })} />
          </Cols>
          <Field label="Where" hint="A venue, city, or “Microsoft Teams (online)”." value={block.location} onChange={(location) => onChange({ ...block, location })} />
          <div>
            <span className="mb-1 block text-[12px] font-medium text-muted">Details</span>
            <RichTextEditor
              label={`${name} details`}
              placeholder="What the event covers, who should attend…"
              value={block.html}
              onChange={(html) => onChange({ ...block, html })}
              minHeight={72}
            />
          </div>
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label="Button label" value={block.buttonLabel} onChange={(buttonLabel) => onChange({ ...block, buttonLabel })} />
            <Field label="Button link" value={block.buttonUrl} onChange={(buttonUrl) => onChange({ ...block, buttonUrl })} />
          </Cols>
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <ColorField label="Card colour" value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <AutoColor
              label="Title and button colour"
              autoLabel="Accent"
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
                    <span className="text-[12px] font-semibold text-ink-2">Card {cardIndex + 1}</span>
                    {block.cards.length > 1 ? (
                      <IconButton
                        label={`Remove card ${cardIndex + 1}`}
                        danger
                        onClick={() => onChange({ ...block, cards: block.cards.filter((item) => item.id !== card.id) })}
                      >
                        <IconTrash />
                      </IconButton>
                    ) : null}
                  </div>
                  <ImageField
                    label="Image (optional)"
                    hint="Shown at the top of the card."
                    value={card.image}
                    fallbackLabel="No image"
                    maxWidth={600}
                    onChange={(image) => setCard({ image })}
                  />
                  <Field label="Title" value={card.title} onChange={(title) => setCard({ title })} />
                  <RichTextEditor
                    compact
                    label={`${name} card ${cardIndex + 1} text`}
                    placeholder="A sentence or two about this item."
                    value={card.html}
                    onChange={(html) => setCard({ html })}
                    minHeight={64}
                  />
                  <Cols className="gap-3 @[22rem]:grid-cols-2">
                    <Field label="Link label" value={card.linkLabel} onChange={(linkLabel) => setCard({ linkLabel })} />
                    <Field label="Link" value={card.linkUrl} onChange={(linkUrl) => setCard({ linkUrl })} />
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
              Add a card
            </button>
          ) : (
            <p className="text-[12px] text-muted">Up to three cards fit side by side.</p>
          )}
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <ColorField label="Card colour" value={block.background} onChange={(background) => onChange({ ...block, background })} />
            <OptionalColor label="Border" value={block.border} fallback="#E0E0E0" onChange={(border) => onChange({ ...block, border })} />
          </Cols>
        </div>
      )
    case 'signature':
      return (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <Field label="Sign-off" hint="e.g. Thanks, or Best regards," value={block.signoff} onChange={(signoff) => onChange({ ...block, signoff })} />
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label="Name" value={block.name} onChange={(value) => onChange({ ...block, name: value })} />
            <Field label="Role" value={block.role} onChange={(role) => onChange({ ...block, role })} />
          </Cols>
          <Cols className="gap-3 @[22rem]:grid-cols-2">
            <Field label="Team" value={block.team} onChange={(team) => onChange({ ...block, team })} />
            <Field label="Email" value={block.email} onChange={(email) => onChange({ ...block, email })} />
          </Cols>
          <ImageField
            label="Photo (optional)"
            hint="A square headshot works best. Shown round, 64px."
            value={block.photo}
            fallbackLabel="No photo"
            maxWidth={192}
            onChange={(photo) => onChange({ ...block, photo })}
          />
        </div>
      )
    default:
      return <p className="text-[12px] text-muted">A thin grey line that separates two parts of the newsletter.</p>
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
      <Field label="Title (optional)" hint="Shown above the table, e.g. Agenda." value={block.title} onChange={(title) => onChange({ ...block, title })} />
      <Cols className="gap-3 @[22rem]:grid-cols-[auto_1fr]">
        <Segmented
          label="Columns"
          value={String(columns)}
          options={[
            ['2', '2'],
            ['3', '3'],
            ['4', '4'],
          ]}
          onChange={(count) => setColumns(Number(count))}
        />
        <div className="flex flex-wrap items-end gap-x-4">
          <Toggle label="Header row" checked={block.header} onChange={(header) => onChange({ ...block, header })} />
          <Toggle label="Striped rows" checked={block.striped} onChange={(striped) => onChange({ ...block, striped })} />
        </div>
      </Cols>
      <div className="grid gap-1.5" role="group" aria-label={`${name} cells`}>
        {block.rows.map((row, r) => (
          <div key={r} className="flex min-w-0 items-center gap-1.5">
            <div className="grid min-w-0 flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {row.map((cell, c) => (
                <input
                  key={c}
                  value={cell}
                  aria-label={`${block.header && r === 0 ? 'Header' : `Row ${block.header ? r : r + 1}`}, column ${c + 1}`}
                  placeholder={block.header && r === 0 ? 'Heading' : ''}
                  onChange={(event) => setCell(r, c, event.target.value)}
                  className={'ui-field ui-field-sm min-w-0 ' + (block.header && r === 0 ? 'font-semibold' : '')}
                />
              ))}
            </div>
            <IconButton
              label={`Remove ${block.header && r === 0 ? 'header row' : `row ${block.header ? r : r + 1}`}`}
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
        Add a row
      </button>
      <Cols className="gap-3 @[24rem]:grid-cols-3">
        <ColorField label="Header colour" value={block.headerBackground} onChange={(headerBackground) => onChange({ ...block, headerBackground })} />
        <ColorField label="Header text" value={block.headerText} onChange={(headerText) => onChange({ ...block, headerText })} />
        <ColorField label="Lines" value={block.border} onChange={(border) => onChange({ ...block, border })} />
      </Cols>
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
          Custom
        </button>
      </div>
      {value ? <ColorField label={`${label} (custom)`} value={value} onChange={onChange} /> : null}
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
        <strong>Preview:</strong> how the callout text reads on this shade.
      </span>
    </div>
  )
}

/** A colour that can be switched off (borders). */
function OptionalColor({
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
      {value ? <ColorField label={`${label} colour`} value={value} onChange={onChange} /> : null}
    </div>
  )
}

export function FooterSection({ design, patch }: { design: NewsletterDesign; patch: Patch }) {
  const f = design.footer
  return (
    <Section title="Footer" anchor="footer" noCopilot>
      <div>
        <span className="mb-1 block text-[12px] font-medium text-muted">Footer message</span>
        <RichTextEditor
          compact
          label="Footer message"
          placeholder="A sign-off, contact line, or why the reader receives this email."
          value={f.html}
          onChange={(html) => patch('footer', { html })}
          minHeight={72}
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12px] font-semibold">Footer links</span>
          <button
            type="button"
            onClick={() => patch('footer', { links: [...f.links, newFooterLink()] })}
            className="text-[12px] font-semibold text-forest hover:text-forest-deep hover:underline"
          >
            Add footer link
          </button>
        </div>
        {f.links.length === 0 ? <p className="text-[12px] text-muted">No links. Privacy and unsubscribe links usually go here.</p> : null}
        <ul className="grid gap-2">
          {f.links.map((link, index) => (
            <li key={link.id} className="flex items-start gap-1.5">
              <input
                value={link.label}
                aria-label={`Link ${index + 1} label`}
                placeholder="Label"
                onChange={(event) =>
                  patch('footer', { links: f.links.map((item) => (item.id === link.id ? { ...item, label: event.target.value } : item)) })
                }
                className="ui-field ui-field-sm w-[40%] min-w-0"
              />
              <input
                value={link.url}
                aria-label={`Link ${index + 1} address`}
                placeholder="https://"
                onChange={(event) =>
                  patch('footer', { links: f.links.map((item) => (item.id === link.id ? { ...item, url: event.target.value } : item)) })
                }
                className="ui-field ui-field-sm min-w-0 flex-1"
              />
              <IconButton
                label={`Remove link ${index + 1}`}
                danger
                onClick={() => patch('footer', { links: f.links.filter((item) => item.id !== link.id) })}
              >
                <IconTrash />
              </IconButton>
            </li>
          ))}
        </ul>
      </div>
      <Toggle label="Show Microsoft logo" checked={f.showMark} onChange={(showMark) => patch('footer', { showMark })} />
      {f.showMark ? (
        <ImageField
          label="Footer logo image (optional)"
          hint="Replaces the four-square mark and wordmark. Shown 18px tall."
          value={f.logo}
          fallbackLabel="Four-square mark and “Microsoft”"
          maxWidth={300}
          onChange={(logo) => patch('footer', { logo })}
        />
      ) : null}
      <Field
        label="Small print"
        hint="Copyright and address. One line per line."
        multiline
        value={f.legal}
        onChange={(legal) => patch('footer', { legal })}
      />
      <Cols className="gap-3.5 @[22rem]:grid-cols-2">
        <ColorField label="Footer colour" value={f.background} onChange={(background) => patch('footer', { background })} />
        <ColorField label="Footer text" value={f.text} onChange={(text) => patch('footer', { text })} />
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
            {name}
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
  // Follow outside changes (theme buttons, campaign switch).
  if (value !== last) {
    setLast(value)
    setDraft(value)
  }
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className="relative h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[var(--r-sm)] ring-1 ring-line-strong ring-inset" style={{ background: value }}>
          <input
            type="color"
            value={value}
            aria-label={`${label} picker`}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
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
      </span>
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
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
