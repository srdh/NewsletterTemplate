import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePopover } from '../hooks/usePopover'
import { newBlock, readDesign, writeDesign, cloneBlock, type BlockKind, type BodyBlock, type NewsletterDesign } from '../lib/newsletter'
import { isRichEmpty } from '../lib/richText'
import type { Campaign, CampaignBundle } from '../types'
import { Field } from './FieldForm'
import { IconChevron, IconDuplicate, IconPlus, IconSpark, IconTrash } from './Icons'
import {
  BannerSection,
  BlockEditor,
  FooterSection,
  IconButton,
  KIND_HINT,
  OptionalColor,
  StyleSection,
  blockSummary,
  type Patch,
} from './NewsletterFields'
import { EditorLookContext } from './RichTextEditor'
import { t } from '../lib/i18n'
import { EmailLanguageField } from './EmailLanguageField'

/*
 * Custom 2: the email as a list of blocks. Open a block to edit it on its own
 * page, then come back to the list. The banner and footer are fixed at the top
 * and bottom; the blocks in between can be added, moved, copied, and removed.
 */

/** Blocks you can add to a Custom 2 email, in menu order. */
const ADD_KINDS: BlockKind[] = [
  'text',
  'heading',
  'stats',
  'columns',
  'table',
  'details',
  'event',
  'spotlights',
  'gallery',
  'people',
  'button',
  'signature',
  'image',
  'card',
  'callout',
  'media',
  'section',
  'divider',
]

/** Custom 2 calls the button block "Call to action". */
const LABEL: Record<BlockKind, string> = {
  get text() {
    return t("Text")
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
  get button() {
    return t("Call to action")
  },
  get signature() {
    return t("Signature")
  },
  get image() {
    return t("Image")
  },
  get card() {
    return t("Card")
  },
  get callout() {
    return t("Callout")
  },
  get media() {
    return t("Image + text")
  },
  get section() {
    return t("Colour band")
  },
  get divider() {
    return t("Divider")
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

const HINT: Record<BlockKind, string> = { ...KIND_HINT, get button() {
    return t("A button that links to registration or a page")
  } }

type View = { kind: 'list' } | { kind: 'settings' } | { kind: 'banner' } | { kind: 'footer' } | { kind: 'block'; id: string }

export function OutlineFields({
  bundle,
  set,
  focusRequest,
  onShowCampaigns,
  onSaveTemplate,
}: {
  bundle: CampaignBundle
  set: (patch: Partial<Campaign>) => void
  /** A click on the preview: open the block it belongs to. */
  focusRequest?: { anchor: string; key: number } | null
  onShowCampaigns: () => void
  /** Saves this email as a reusable template; resolves when saved. */
  onSaveTemplate: (name: string) => void
}) {
  const c = bundle.campaign
  const design = useMemo(() => readDesign(c), [c.newsletter]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = (next: NewsletterDesign) => set({ newsletter: writeDesign(next) })
  const patch: Patch = (key, value) => save({ ...design, [key]: { ...(design[key] as object), ...(value as object) } })
  const setBlocks = (blocks: BodyBlock[]) => save({ ...design, blocks })

  const [view, setView] = useState<View>({ kind: 'list' })
  const scroller = useRef<HTMLDivElement>(null)

  // A different campaign starts on the list.
  useEffect(() => {
    setView({ kind: 'list' })
  }, [c.id])
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [view])

  // Clicks in the preview open the matching block.
  const handled = useRef<number | null>(null)
  useEffect(() => {
    if (!focusRequest || handled.current === focusRequest.key) return
    handled.current = focusRequest.key
    const anchor = focusRequest.anchor
    if (anchor === 'banner') setView({ kind: 'banner' })
    else if (anchor === 'footer') setView({ kind: 'footer' })
    else if (anchor.startsWith('block:')) setView({ kind: 'block', id: anchor.slice(6) })
  }, [focusRequest])

  const openBlock = view.kind === 'block' ? design.blocks.find((block) => block.id === view.id) : undefined
  // A deleted block goes back to the list.
  useEffect(() => {
    if (view.kind === 'block' && !openBlock) setView({ kind: 'list' })
  }, [view, openBlock])

  /** New blocks go right below the block you have open, or at the end from the list. */
  function addBlock(kind: BlockKind) {
    const made = newBlock(kind)
    // A block added inside a band joins that band.
    const block: BodyBlock = openBlock?.shade && kind !== 'section' ? { ...made, shade: openBlock.shade } : made
    const at = openBlock ? design.blocks.indexOf(openBlock) + 1 : design.blocks.length
    setBlocks([...design.blocks.slice(0, at), block, ...design.blocks.slice(at)])
    setView({ kind: 'block', id: block.id })
  }

  return (
    <EditorLookContext.Provider value={{ font: design.style.font, size: design.style.size }}>
      <div ref={scroller} className="app-scroll relative min-h-0 flex-1 overflow-auto px-4 pt-3 pb-6 sm:px-5">
        {view.kind === 'list' ? (
          <ListView
            campaign={c}
            design={design}
            set={set}
            onShowCampaigns={onShowCampaigns}
            onOpen={setView}
          />
        ) : (
          <DetailView
            title={
              view.kind === 'settings'
                ? t("Email settings")
                : view.kind === 'banner'
                  ? t("Banner")
                  : view.kind === 'footer'
                    ? t("Footer")
                    : openBlock
                      ? LABEL[openBlock.kind]
                      : ''
            }
            onBack={() => setView({ kind: 'list' })}
            actions={
              openBlock ? (
                <BlockActions
                  blocks={design.blocks}
                  block={openBlock}
                  onChange={setBlocks}
                  onOpen={(id) => setView({ kind: 'block', id })}
                />
              ) : null
            }
          >
            {view.kind === 'settings' ? (
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5">
                <Field label={t("Email subject")} value={c.subject} onChange={(subject) => set({ subject })} />
                <EmailLanguageField value={c.language} onChange={(language) => set({ language })} />
                <StyleSection design={design} save={save} patch={patch} />
              </div>
            ) : null}
            {view.kind === 'banner' ? <BannerSection campaign={c} set={set} design={design} patch={patch} /> : null}
            {view.kind === 'footer' ? <FooterSection design={design} patch={patch} /> : null}
            {openBlock ? (
              <BlockEditor
                key={openBlock.id}
                block={openBlock}
                name={LABEL[openBlock.kind]}
                index={design.blocks.indexOf(openBlock)}
                accent={design.style.accent}
                onChange={(next) => setBlocks(design.blocks.map((block) => (block.id === next.id ? next : block)))}
              />
            ) : null}
            {openBlock && openBlock.kind !== 'section' ? (
              <div className="mt-5 grid gap-1.5 border-t border-line pt-4">
                <OptionalColor
                  label={t("Background band")}
                  value={openBlock.shade ?? ''}
                  fallback="#EDF6F3"
                  onChange={(shade) =>
                    setBlocks(design.blocks.map((block) => (block.id === openBlock.id ? { ...block, shade: shade || undefined } : block)))
                  }
                />
                <p className="text-[12px] leading-4 text-muted">
                  {t("Colours the full width behind this block. Blocks next to each other with the same colour join into one band.")}</p>
              </div>
            ) : null}
          </DetailView>
        )}
      </div>
      <BottomBar campaignName={c.name} onAdd={addBlock} onSaveTemplate={onSaveTemplate} />
    </EditorLookContext.Provider>
  )
}

function ListView({
  campaign,
  design,
  set,
  onShowCampaigns,
  onOpen,
}: {
  campaign: Campaign
  design: NewsletterDesign
  set: (patch: Partial<Campaign>) => void
  onShowCampaigns: () => void
  onOpen: (view: View) => void
}) {
  const bannerSummary = [campaign.kicker, campaign.title].filter((part) => part.trim()).join(', ') || t("No headline yet")
  const footerSummary = isRichEmpty(design.footer.html)
    ? design.footer.legal.split('\n')[0] || t("Small print")
    : design.footer.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  return (
    <div>
      <button
        type="button"
        onClick={onShowCampaigns}
        className="-ml-1 flex items-center gap-1 rounded-[var(--r-sm)] px-1 py-0.5 text-[13px] font-semibold text-forest hover:bg-forest-soft"
      >
        <IconChevron className="rotate-90" />
        {t("All campaigns")}</button>

      <CampaignName value={campaign.name} onChange={(name) => set({ name })} />

      <p className="mt-3 flex items-start gap-2 rounded-[var(--r-md)] border border-[#C7E0F4] bg-[#F3F9FD] px-3 py-2.5 text-[13px] leading-[18px] text-ink-2">
        <span className="mt-px shrink-0 text-[#0F6CBD]">
          <IconSpark />
        </span>
        {t("Ask Copilot to fill or change the subject and banner, or open any block to edit it yourself.")}</p>

      <ul className="mt-3 overflow-hidden rounded-[var(--r-md)] border border-line bg-surface" aria-label={t("Blocks in this email")}>
        <Row thumb={<Thumb kind="settings" />} title={t("Email settings")} summary={campaign.subject || t("Subject, theme, font, width")} onClick={() => onOpen({ kind: 'settings' })} />
        <Row thumb={<Thumb kind="banner" />} title={t("Banner")} summary={bannerSummary} onClick={() => onOpen({ kind: 'banner' })} />
        {design.blocks.map((block) => (
          <Row
            key={block.id}
            thumb={<Thumb kind={block.kind} />}
            title={LABEL[block.kind]}
            summary={blockSummary(block) || HINT[block.kind]}
            band={block.kind === 'section' ? undefined : block.shade}
            onClick={() => onOpen({ kind: 'block', id: block.id })}
          />
        ))}
        <Row thumb={<Thumb kind="footer" />} title={t("Footer")} summary={footerSummary} onClick={() => onOpen({ kind: 'footer' })} />
      </ul>
      {design.blocks.length === 0 ? (
        <p className="mt-3 text-center text-[13px] text-muted">{t("No blocks between the banner and footer yet. Use Add block below.")}</p>
      ) : null}
    </div>
  )
}

/** The campaign name as a heading; click it to rename. */
function CampaignName({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editing) input.current?.select()
  }, [editing])
  const commit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== value) onChange(next)
    else setDraft(value)
  }
  return (
    <div className="mt-4">
      {editing ? (
        <input
          ref={input}
          value={draft}
          aria-label={t("Campaign name")}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') {
              setDraft(value)
              setEditing(false)
            }
          }}
          className="ui-field w-full text-[18px] font-semibold"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setEditing(true)
          }}
          title={t("Rename")}
          className="-mx-1 block max-w-full truncate rounded-[var(--r-sm)] px-1 text-left text-[20px] font-semibold leading-7 text-ink hover:bg-fill"
        >
          {value || t("Untitled campaign")}
        </button>
      )}
      <p className="mt-0.5 text-[12px] text-muted">{t("Click the name to rename. Only shown in this app.")}</p>
    </div>
  )
}

function Row({
  thumb,
  title,
  summary,
  band,
  onClick,
}: {
  thumb: ReactNode
  title: string
  summary: string
  /** Band colour behind the block, shown as a strip on the left. */
  band?: string
  onClick: () => void
}) {
  return (
    <li className="border-b border-line last:border-b-0" style={band ? { boxShadow: `inset 4px 0 0 ${band}` } : undefined}>
      <button type="button" onClick={onClick} className="flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-fill">
        {thumb}
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-5 text-ink">{title}</span>
          <span className="block truncate text-[12px] leading-4 text-muted">{summary}</span>
        </span>
        <IconChevron className="shrink-0 -rotate-90 text-ink-2" />
      </button>
    </li>
  )
}

function DetailView({
  title,
  onBack,
  actions,
  children,
}: {
  title: string
  onBack: () => void
  actions: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 flex items-center gap-1 rounded-[var(--r-sm)] px-1 py-0.5 text-[13px] font-semibold text-forest hover:bg-forest-soft"
      >
        <IconChevron className="rotate-90" />
        {t("All blocks")}</button>
      <div className="mt-3 mb-3 flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-[18px] font-semibold leading-6 text-ink">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  )
}

function BlockActions({
  blocks,
  block,
  onChange,
  onOpen,
}: {
  blocks: BodyBlock[]
  block: BodyBlock
  onChange: (blocks: BodyBlock[]) => void
  onOpen: (id: string) => void
}) {
  const index = blocks.indexOf(block)
  const move = (by: -1 | 1) => {
    const target = index + by
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <span className="mr-1 text-[12px] text-muted">
        {t('{n} of {total}', { n: index + 1, total: blocks.length })}
      </span>
      <IconButton label={t("Move up")} disabled={index === 0} onClick={() => move(-1)}>
        <IconChevron className="rotate-180" />
      </IconButton>
      <IconButton label={t("Move down")} disabled={index === blocks.length - 1} onClick={() => move(1)}>
        <IconChevron />
      </IconButton>
      <IconButton
        label={t("Duplicate block")}
        onClick={() => {
          const copy = cloneBlock(block)
          onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)])
          onOpen(copy.id)
        }}
      >
        <IconDuplicate />
      </IconButton>
      <IconButton label={t("Delete block")} danger onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}>
        <IconTrash />
      </IconButton>
    </div>
  )
}

function BottomBar({
  campaignName,
  onAdd,
  onSaveTemplate,
}: {
  campaignName: string
  onAdd: (kind: BlockKind) => void
  onSaveTemplate: (name: string) => void
}) {
  const add = usePopover()
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const nameInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (naming) nameInput.current?.select()
  }, [naming])

  return (
    <div className="relative shrink-0 border-t border-line bg-surface px-4 py-3 sm:px-5">
      {naming ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onSaveTemplate(name)
            setNaming(false)
          }}
        >
          <input
            ref={nameInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label={t("Template name")}
            placeholder={t("Template name")}
            className="ui-field ui-field-sm min-w-0 flex-1 basis-40"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setNaming(false)
            }}
          />
          <button type="submit" className="ui-btn ui-btn-primary min-h-8 px-3 py-1 text-[13px]">
            {t("Save template")}</button>
          <button type="button" className="ui-btn ui-btn-ghost min-h-8 px-3 py-1 text-[13px]" onClick={() => setNaming(false)}>
            {t("Cancel")}</button>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <div ref={add.root} className="relative">
            <button
              ref={add.trigger}
              type="button"
              aria-haspopup="menu"
              aria-expanded={add.open}
              onClick={() => add.setOpen(!add.open)}
              className="ui-btn w-full gap-1.5 border border-forest bg-surface font-semibold text-forest hover:bg-forest-soft"
            >
              <IconPlus />
              {t("Add block")}</button>
            {add.open ? (
              <div
                role="menu"
                aria-label={t("Add a block")}
                className="ui-popover absolute bottom-[calc(100%+8px)] left-0 z-30 max-h-[60vh] w-[min(320px,calc(100vw-32px))] overflow-auto p-1"
              >
                {ADD_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-[var(--r-sm)] px-2 py-1.5 text-left hover:bg-fill"
                    onClick={() => {
                      add.close()
                      onAdd(kind)
                    }}
                  >
                    <Thumb kind={kind} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-[18px] text-ink">{LABEL[kind]}</span>
                      <span className="block text-[11px] leading-4 text-muted">{HINT[kind]}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="ui-btn ui-btn-ghost w-full gap-1.5"
            onClick={() => {
              setName(campaignName === 'Untitled campaign' ? '' : campaignName)
              setNaming(true)
            }}
          >
            <IconTemplate />
            {t("Save as template")}</button>
        </div>
      )}
    </div>
  )
}

/** Small drawings of each block, like a wireframe. */
function Thumb({ kind }: { kind: BlockKind | 'settings' | 'banner' | 'footer' }) {
  const line = 'h-[3px] rounded-full bg-[#C8C8C8]'
  const green = 'bg-forest'
  let inner: ReactNode
  switch (kind) {
    case 'banner':
      inner = (
        <>
          <span className={'absolute inset-x-0 top-0 h-[7px] ' + green} />
          <span className={'absolute top-[11px] left-1.5 w-5 ' + line} />
          <span className={'absolute top-[17px] left-1.5 w-3.5 ' + line} />
        </>
      )
      break
    case 'event':
      inner = (
        <span className="absolute inset-1 rounded-[2px] bg-[#E3F0D8]">
          <span className="absolute top-1 left-1 h-[3px] w-4 rounded-full bg-[#7FB36A]" />
          <span className="absolute top-[9px] left-1 h-[3px] w-5 rounded-full bg-[#B9D7A9]" />
        </span>
      )
      break
    case 'table':
      inner = (
        <span className="absolute inset-1 grid grid-rows-3 gap-px overflow-hidden rounded-[2px] bg-[#C8C8C8]">
          <span className="bg-[#E6E6E6]" />
          <span className="bg-white" />
          <span className="bg-white" />
        </span>
      )
      break
    case 'spotlights':
      inner = (
        <span className="absolute inset-1 grid grid-cols-2 gap-1">
          <span className="rounded-[2px] bg-[#E6E6E6]" />
          <span className="rounded-[2px] bg-[#E6E6E6]" />
        </span>
      )
      break
    case 'button':
      inner = <span className={'absolute top-1/2 left-1/2 h-[7px] w-5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] ' + green} />
      break
    case 'signature':
      inner = (
        <>
          <span className={'absolute top-2 left-1.5 w-3 ' + line} />
          <span className={'absolute top-[14px] left-1.5 w-5 ' + line} />
        </>
      )
      break
    case 'image':
      inner = (
        <span className="absolute inset-1 rounded-[2px] bg-[#E6E6E6]">
          <span className="absolute bottom-1 left-1 h-0 w-0 border-r-[6px] border-b-[7px] border-l-[6px] border-r-transparent border-b-[#B5B5B5] border-l-transparent" />
        </span>
      )
      break
    case 'card':
      inner = (
        <span className="absolute inset-1 rounded-[2px] border-2 border-[#D4EC8E]">
          <span className={'absolute top-1 left-1 w-3 ' + line} />
        </span>
      )
      break
    case 'callout':
      inner = (
        <span className="absolute inset-1 rounded-[2px] bg-[#EBF3EF]">
          <span className={'absolute inset-y-0 left-0 w-[3px] ' + green} />
        </span>
      )
      break
    case 'media':
      inner = (
        <>
          <span className="absolute top-1.5 left-1 h-3.5 w-3.5 rounded-[2px] bg-[#B9DCD2]" />
          <span className={'absolute top-2 left-6 w-2 ' + line} />
          <span className={'absolute top-[14px] left-6 w-1.5 ' + line} />
        </>
      )
      break
    case 'section':
      inner = <span className="absolute inset-x-0 top-1.5 bottom-1.5 bg-[#194449]" />
      break
    case 'divider':
      inner = <span className="absolute inset-x-1.5 top-1/2 h-px bg-[#B5B5B5]" />
      break
    case 'footer':
      inner = <span className="absolute inset-x-0 bottom-0 h-2 bg-[#D9D9D9]" />
      break
    case 'heading':
      inner = (
        <>
          <span className="absolute top-2 left-1.5 h-[4px] w-5 rounded-full bg-[#5A6B7B]" />
          <span className="absolute top-[14px] inset-x-1.5 h-[2px] bg-[#0078D4]" />
        </>
      )
      break
    case 'stats':
      inner = (
        <span className="absolute inset-1 grid grid-cols-3 gap-px">
          <span className="bg-[#02AE68]" />
          <span className="bg-[#FCFC92]" />
          <span className="bg-[#E2EFD9]" />
        </span>
      )
      break
    case 'columns':
      inner = (
        <span className="absolute inset-1 grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex flex-col gap-[3px]">
              <span className="h-[3px] rounded-full bg-[#7FB36A]" />
              <span className={line} />
              <span className={line} />
            </span>
          ))}
        </span>
      )
      break
    case 'gallery':
      inner = (
        <span className="absolute inset-1 grid grid-cols-3 grid-rows-2 gap-px">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="bg-[#C9D6DF]" />
          ))}
        </span>
      )
      break
    case 'people':
      inner = (
        <span className="absolute inset-1 flex items-center justify-around">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[9px] w-[9px] rounded-full bg-[#B5B5B5]" />
          ))}
        </span>
      )
      break
    case 'details':
      inner = (
        <span className="absolute inset-1 rounded-[2px] bg-[#F3F8FC]">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-[#0078D4]" />
          <span className="absolute top-[5px] left-1.5 h-[3px] w-2 rounded-full bg-[#77206D]" />
          <span className="absolute top-[5px] left-[14px] h-[3px] w-2 rounded-full bg-[#C8C8C8]" />
          <span className="absolute top-[11px] left-1.5 h-[3px] w-2 rounded-full bg-[#77206D]" />
          <span className="absolute top-[11px] left-[14px] h-[3px] w-2 rounded-full bg-[#C8C8C8]" />
        </span>
      )
      break
    case 'settings':
      inner = (
        <span className="absolute inset-0 flex items-center justify-center text-ink-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 1.75v2M8 12.25v2M1.75 8h2M12.25 8h2M3.6 3.6 5 5M11 11l1.4 1.4M3.6 12.4 5 11M11 5l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      )
      break
    default:
      inner = (
        <>
          <span className={'absolute top-1.5 left-1.5 w-5 ' + line} />
          <span className={'absolute top-[12px] left-1.5 w-5 ' + line} />
          <span className={'absolute top-[18px] left-1.5 w-3 ' + line} />
        </>
      )
  }
  return (
    <span aria-hidden="true" className="relative block h-[26px] w-[34px] shrink-0 overflow-hidden rounded-[3px] border border-line-strong bg-white">
      {inner}
    </span>
  )
}

function IconTemplate() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.25 6h11.5M6 6v7.75" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
