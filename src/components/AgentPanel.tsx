import { useEffect, useRef, useState } from 'react'
import { applyFill, changesFor, emailForAgent, type FieldChange } from '../lib/agent/apply'
import {
  ProviderNotConnected,
  fillCampaign,
  type FillSource,
} from '../lib/agent/provider'
import type { AgentFill } from '../lib/agent/schema'
import type { Campaign, CampaignBundle, MasterType } from '../types'
import { MASTER_LABEL } from '../types'
import { STARTERS } from '../data/starters'
import type { UserTemplate } from '../data/userTemplates'
import { edited } from './CampaignSwitcher'
import { IconCalendar, IconChevron, IconDuplicate, IconNewsletter, IconSend, IconSpark, IconTable, IconTrash } from './Icons'

type ChatItem = {
  id: string
  role: 'user' | 'assistant'
  text: string
  fill?: AgentFill
  source?: FillSource
  state?: 'open' | 'applied' | 'discarded'
  /** Short record shown under the reply once the person applies or discards. */
  note?: string
}

/** What a new email can start from. "custom" is the ME7 learning paths layout. */
export type NewEmailChoice =
  | 'event_invite'
  | 'monthly_update'
  | 'weekly_snapshot'
  | 'custom'
  | 'custom2'
  | 'hackathon-registration'
  | 'hackathon-fy-summary'
  | 'hackathon-register-today'
  | 'hackathon-blank'

/** Campaigns under the Hackathons template. */
const HACKATHON_CAMPAIGNS = STARTERS.filter((starter) => starter.master === 'hackathon') as {
  id: Extract<NewEmailChoice, `hackathon-${string}`>
  label: string
  hint?: string
}[]

interface GroupCampaign {
  id: NewEmailChoice
  label: string
  hint?: string
}

/** Campaigns under Partner Template: the four classic Partner Skilling emails. */
const PARTNER_CAMPAIGNS: GroupCampaign[] = [
  { id: 'event_invite', label: 'Regional Template', hint: 'Event invite with banner, event details, agenda, and signature' },
  { id: 'monthly_update', label: 'Partner Skilling Update Template', hint: 'Monthly newsletter with spotlight cards and skilling tables' },
  { id: 'weekly_snapshot', label: 'Weekly Project Snapshot', hint: 'Status email with request, progress, and delivery tables' },
  { id: 'custom', label: 'Custom', hint: 'Free-form newsletter like ME7 + Copilot learning paths: hero image, cards, rich text' },
]

const RECENT_COUNT = 5

const TYPE_ICON: Record<MasterType, React.ReactNode> = {
  event_invite: <IconCalendar />,
  monthly_update: <IconNewsletter />,
  weekly_snapshot: <IconTable />,
  newsletter: <IconCustom />,
  custom2: <IconBlocks />,
  hackathon: <IconTrophy />,
}

export function AgentPanel({
  bundle,
  onApply,
  prefill,
  campaigns,
  onNew,
  onOpen,
  onCopy,
  templates,
  onUseTemplate,
  onDeleteTemplate,
}: {
  bundle: CampaignBundle
  onApply: (bundle: CampaignBundle) => void
  /** A starting prompt handed over by "Fill with Copilot" on a form section. */
  prefill?: { text: string; key: number } | null
  /** Every campaign, for the Recent list. */
  campaigns: Campaign[]
  /** Start a new email from one of the four templates. */
  onNew: (choice: NewEmailChoice) => void
  onOpen: (id: string) => void
  /** Start a new email from a copy of an earlier one. */
  onCopy: (id: string) => void
  /** Templates saved with "Save as template". */
  templates: UserTemplate[]
  onUseTemplate: (id: string) => void
  onDeleteTemplate: (id: string) => void
}) {
  const [items, setItems] = useState<ChatItem[]>([])
  const [openGroup, setOpenGroup] = useState<'partner' | 'hackathons' | null>(null)
  const toggleGroup = (group: 'partner' | 'hackathons') => setOpenGroup((open) => (open === group ? null : group))
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!prefill) return
    setDraft(prefill.text)
    // Wait for the pane to be shown (phones switch to it), then put the caret at the end.
    requestAnimationFrame(() => {
      const node = input.current
      if (!node) return
      node.focus()
      node.setSelectionRange(node.value.length, node.value.length)
    })
  }, [prefill])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ text: string; detail: string; prompt: string } | null>(null)
  const thread = useRef<HTMLDivElement>(null)
  const ticket = useRef(0)

  useEffect(() => {
    ticket.current += 1
    setItems([])
    setError(null)
    setBusy(false)
  }, [bundle.campaign.id])

  useEffect(() => {
    const node = thread.current
    // Empty thread starts at the top (intro + starters); a conversation follows the latest reply.
    if (node) node.scrollTop = items.length ? node.scrollHeight : 0
  }, [items, busy, error])

  async function send(override?: string) {
    const prompt = override?.trim() || draft.trim()
    if (!prompt || busy) return
    const id = crypto.randomUUID()
    // The agent sees the conversation so far and the email as it is now.
    const history = items.map((item) => ({
      role: item.role,
      text:
        item.role === 'assistant'
          ? [item.text, item.note ?? (item.state === 'open' ? '(Changes proposed, not applied yet.)' : '')]
              .filter(Boolean)
              .join(' ')
          : item.text,
    }))
    const currentEmail = emailForAgent(bundle)
    setItems((current) => [...current, { id, role: 'user', text: prompt }])
    setDraft('')
    setError(null)
    setBusy(true)
    const mine = ++ticket.current
    try {
      const { fill, source } = await fillCampaign(prompt, { history, current: currentEmail })
      if (mine !== ticket.current) return
      const hasChanges = changesFor(bundle, fill).length > 0
      setItems((list) => [
        ...list,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text:
            fill.reply ||
            (hasChanges
              ? 'Here is what I would change. Nothing updates until you apply.'
              : 'Nothing to change for that request.'),
          fill: hasChanges ? fill : undefined,
          source,
          state: hasChanges ? 'open' : undefined,
        },
      ])
    } catch (caught) {
      if (mine !== ticket.current) return
      const detail = caught instanceof Error ? caught.message : String(caught)
      setError(
        caught instanceof ProviderNotConnected
          ? {
              text: "Copilot isn't connected right now. You can still fill every field by hand.",
              detail: 'For whoever set up this app: ANTHROPIC_API_KEY is missing. Add it to .env (or to Vercel), then restart.',
              prompt,
            }
          : { text: "Copilot couldn't finish that request. Try again in a moment.", detail, prompt },
      )
    } finally {
      if (mine === ticket.current) setBusy(false)
    }
  }

  /** Sends the failed message again, without repeating it in the thread. */
  function retry() {
    if (!error) return
    const { prompt } = error
    setItems((list) => {
      const last = list[list.length - 1]
      return last?.role === 'user' && last.text === prompt ? list.slice(0, -1) : list
    })
    void send(prompt)
  }

  function apply(itemId: string, fill: AgentFill) {
    const labels = changesFor(bundle, fill).map((change) => change.label)
    onApply(applyFill(bundle, fill))
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              state: 'applied',
              note: labels.length ? `Applied: ${labels.join(', ')}.` : 'Applied.',
            }
          : item,
      ),
    )
  }

  function discard(itemId: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, state: 'discarded', note: 'Discarded. The form is unchanged.' }
          : item,
      ),
    )
  }

  const latestOpen = [...items].reverse().find((item) => item.fill && item.state === 'open')?.id
  const canSend = Boolean(draft.trim())
  const hasChat = items.length > 0

  const recent = [...campaigns]
    .sort((x, y) => (y.updated_at ?? '').localeCompare(x.updated_at ?? ''))
    .slice(0, RECENT_COUNT)

  return (
    <section className="copilot-wash flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-13 shrink-0 items-center gap-2.5 px-4">
        <span className="copilot-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <IconSpark />
        </span>
        <h2 className="min-w-0 flex-1 text-[15px] font-semibold leading-5 text-ink">Copilot</h2>
        {hasChat ? (
          <button
            type="button"
            className="ui-btn ui-btn-subtle min-h-7 px-2.5 py-0.5 text-[12px] font-semibold"
            title="Clear this chat and show the templates and recent emails again"
            onClick={() => {
              ticket.current += 1
              setItems([])
              setError(null)
              setBusy(false)
            }}
          >
            Start over
          </button>
        ) : null}
      </header>

      <div
        ref={thread}
        className="app-scroll min-h-0 flex-1 overflow-auto px-4 py-4"
      >
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="pt-4">
              <h3 className="text-[22px] font-semibold leading-7 tracking-[-0.01em] text-ink">
                What email are we <span className="copilot-text">building?</span>
              </h3>
              <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-ink-2">
                Start from a template, or pick up a recent email. Ask Copilot below to fill in the fields.
              </p>
              <div className="mt-5 grid gap-2" role="group" aria-label="Start a new email">
                <TemplateGroup
                  id="partner-campaigns"
                  title="Partner Template"
                  hint="Partner Skilling emails. Pick a campaign:"
                  icon={<IconPartner />}
                  campaigns={PARTNER_CAMPAIGNS}
                  open={openGroup === 'partner'}
                  onToggle={() => toggleGroup('partner')}
                  onPick={onNew}
                />
                <button
                  type="button"
                  onClick={() => onNew('custom2')}
                  className="copilot-glass group flex items-start gap-3 rounded-[var(--r-lg)] p-3 text-left"
                >
                  <span className="copilot-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest">
                    <IconBlocks />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-5 text-ink">Custom 2</span>
                    <span className="block text-[12px] leading-4 text-muted group-hover:text-ink-2">
                      Edit block by block: banner, text, event card, table, spotlights, call to action, signature
                    </span>
                  </span>
                </button>
                <TemplateGroup
                  id="hackathon-campaigns"
                  title="Hackathons"
                  hint="Hackathon emails, block by block. Pick a campaign:"
                  icon={<IconTrophy />}
                  campaigns={HACKATHON_CAMPAIGNS}
                  open={openGroup === 'hackathons'}
                  onToggle={() => toggleGroup('hackathons')}
                  onPick={onNew}
                />
              </div>

              {templates.length ? (
                <section className="mt-6" aria-labelledby="templates-heading">
                  <h4 id="templates-heading" className="mb-2 text-[13px] font-semibold leading-5 text-ink">
                    Your templates
                  </h4>
                  <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
                    {templates.map((template) => (
                      <li key={template.id} className="group/tpl flex min-w-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onUseTemplate(template.id)}
                          title="Start a new email from this template"
                          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--r-md)] px-2 py-1.5 text-left transition-colors hover:bg-surface/70"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-forest ring-1 ring-line [&_svg]:h-4 [&_svg]:w-4">
                            {TYPE_ICON[template.master_type]}
                          </span>
                          <span className="min-w-0 flex-1 overflow-hidden">
                            <span className="block truncate text-[13px] leading-[18px] text-ink">{template.name}</span>
                            <span className="block truncate text-[11px] leading-4 text-muted">
                              {MASTER_LABEL[template.master_type]} · saved {edited(template.saved_at).replace(/^Edited /, '')}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTemplate(template.id)}
                          aria-label={`Delete template “${template.name}”`}
                          title="Delete template"
                          className="ui-icon-btn ui-icon-btn-danger h-7 w-7 shrink-0 opacity-60 group-hover/tpl:opacity-100 focus-visible:opacity-100"
                        >
                          <IconTrash />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {recent.length ? (
                <section className="mt-6" aria-labelledby="recent-heading">
                  <h4 id="recent-heading" className="mb-2 text-[13px] font-semibold leading-5 text-ink">
                    Recent
                  </h4>
                  <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
                    {recent.map((campaign) => {
                      const current = campaign.id === bundle.campaign.id
                      return (
                        <li key={campaign.id} className="group/recent flex min-w-0 items-center gap-1">
                          <button
                            type="button"
                            aria-current={current ? 'true' : undefined}
                            onClick={() => onOpen(campaign.id)}
                            className={
                              'flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--r-md)] px-2 py-1.5 text-left transition-colors hover:bg-surface/70 ' +
                              (current ? 'bg-surface/80 ring-1 ring-forest-line' : '')
                            }
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-forest ring-1 ring-line [&_svg]:h-4 [&_svg]:w-4">
                              {TYPE_ICON[campaign.master_type]}
                            </span>
                            <span className="min-w-0 flex-1 overflow-hidden">
                              <span className={'block truncate text-[13px] leading-[18px] text-ink ' + (current ? 'font-semibold' : '')}>
                                {campaign.name}
                              </span>
                              <span className="block truncate text-[11px] leading-4 text-muted">
                                {MASTER_LABEL[campaign.master_type]} · {edited(campaign.updated_at)}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCopy(campaign.id)}
                            aria-label={`Use “${campaign.name}” as a sample for a new email`}
                            title="Use as a sample: start a new email from a copy"
                            className="ui-icon-btn h-7 w-7 shrink-0 opacity-60 group-hover/recent:opacity-100 focus-visible:opacity-100"
                          >
                            <IconDuplicate />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
          {items.map((item) =>
            item.role === 'user' ? (
              <article
                key={item.id}
                className="ml-auto w-fit max-w-[88%] rounded-[var(--r-lg)] rounded-br-[var(--r-sm)] bg-forest-soft px-3 py-2 text-[14px] leading-5 text-ink"
              >
                <p className="whitespace-pre-wrap">{item.text}</p>
              </article>
            ) : (
              <article key={item.id} className="flex gap-2.5">
                <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-forest text-white">
                  <IconSpark className="scale-[0.8]" />
                </span>
                <div className="min-w-0 flex-1 text-[14px] leading-5 text-ink">
                  <p className="whitespace-pre-wrap pt-0.5">{item.text}</p>
                  {item.note ? (
                    <p
                      className={
                        'mt-1.5 text-[12px] leading-4 ' +
                        (item.state === 'applied' ? 'font-semibold text-success' : 'text-muted')
                      }
                    >
                      {item.note}
                    </p>
                  ) : null}
                  {item.fill && item.state === 'open' && item.id === latestOpen ? (
                    <Proposal
                      bundle={bundle}
                      fill={item.fill}
                      onApply={() => apply(item.id, item.fill as AgentFill)}
                      onDiscard={() => discard(item.id)}
                    />
                  ) : null}
                </div>
              </article>
            ),
          )}
          {busy ? (
            <p className="flex items-center gap-2 text-[12px] font-semibold text-forest">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-forest" />
              Working on the fields…
            </p>
          ) : null}
          {error ? (
            <div role="alert" className="rounded-[var(--r-md)] border border-danger-line bg-danger-bg px-3 py-2.5 text-[14px] leading-5 text-ink">
              <p>{error.text}</p>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-[var(--r-sm)] font-semibold text-danger underline underline-offset-2"
                  onClick={retry}
                >
                  Try again
                </button>
                <details className="min-w-0 text-[12px] text-muted">
                  <summary className="cursor-pointer select-none">Details</summary>
                  <p className="mt-1 break-words">{error.detail}</p>
                </details>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Compose stays open on every screen size: starters (once chatting)
          and a one-line prompt that grows as you type. */}
      <div className="shrink-0 px-3 pt-2 pb-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <div className="copilot-composer flex min-h-[88px] flex-col gap-2 rounded-[16px] p-3 pb-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Prompt</span>
              <textarea
                ref={input}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void send()
                  }
                }}
                rows={1}
                placeholder="Ask Copilot to fill this email, or paste a brief…"
                className="app-scroll block max-h-[7.5rem] min-h-5 w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-[14px] leading-5 text-ink outline-none placeholder:text-subtle"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !canSend}
              aria-label="Send"
              title="Send"
              className="copilot-send ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            >
              <IconSend />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function Proposal({
  bundle,
  fill,
  onApply,
  onDiscard,
}: {
  bundle: CampaignBundle
  fill: AgentFill
  onApply: () => void
  onDiscard: () => void
}) {
  const changes = changesFor(bundle, fill)
  const [open, setOpen] = useState(true)

  return (
    <div className="proposal-in mt-3 overflow-hidden rounded-[var(--r-lg)] border border-line bg-surface shadow-[var(--elev-sm)]">
      {changes.length === 0 ? (
        <p className="px-3.5 pt-3 text-[12px] text-muted">These values are already in the form.</p>
      ) : (
        <>
          <button
            type="button"
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-fill"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="text-[12px] font-semibold text-ink">
              {open ? 'Hide' : 'Show'} {changes.length} field change
              {changes.length === 1 ? '' : 's'}
            </span>
            <IconChevron
              className={
                'shrink-0 text-muted transition-transform ' +
                (open ? 'rotate-180' : 'rotate-0')
              }
            />
          </button>
          {open ? (
            <ul className="app-scroll max-h-[min(50vh,20rem)] divide-y divide-line overflow-auto border-t border-line">
              {changes.map((change) => (
                <ChangeLine key={change.label} change={change} />
              ))}
            </ul>
          ) : null}
        </>
      )}
      <div className="flex gap-2 border-t border-line bg-panel px-3.5 py-3">
        <button
          type="button"
          disabled={changes.length === 0}
          className="ui-btn ui-btn-primary"
          onClick={onApply}
        >
          Apply
        </button>
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  )
}

function ChangeLine({ change }: { change: FieldChange }) {
  return (
    <li className="px-3.5 py-2.5">
      <p className="text-[12px] font-semibold leading-4 text-muted">{change.label}</p>
      <p
        className={
          'mt-0.5 line-clamp-2 text-[12px] leading-4 text-muted' +
          (change.before ? ' line-through decoration-muted/60' : '')
        }
      >
        {change.before || '(empty)'}
      </p>
      <p className="mt-1 line-clamp-3 rounded-[var(--r-sm)] bg-forest-soft px-2 py-1 text-[12px] leading-4 text-ink">
        {change.after || '(empty)'}
      </p>
    </li>
  )
}

/** Custom newsletter: a page of blocks. */
function IconCustom() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="14" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="10" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="10" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Custom 2: a list of blocks. */
function IconBlocks() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="14" height="4" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="8.5" width="14" height="3" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="14" height="4" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Hackathons: a trophy. */
/** A template with campaigns under it: opens in place to list them. */
function TemplateGroup({
  id,
  title,
  hint,
  icon,
  campaigns,
  open,
  onToggle,
  onPick,
}: {
  id: string
  title: string
  hint: string
  icon: React.ReactNode
  campaigns: GroupCampaign[]
  open: boolean
  onToggle: () => void
  onPick: (choice: NewEmailChoice) => void
}) {
  return (
    <div className="copilot-glass overflow-hidden rounded-[var(--r-lg)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="group flex w-full items-start gap-3 p-3 text-left"
      >
        <span className="copilot-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold leading-5 text-ink">{title}</span>
          <span className="block text-[12px] leading-4 text-muted group-hover:text-ink-2">{hint}</span>
        </span>
        <IconChevron className={'mt-2 shrink-0 text-ink-2 transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>
      {open ? (
        <ul id={id} className="grid gap-1 px-3 pb-3 pl-[60px]">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <button
                type="button"
                onClick={() => onPick(campaign.id)}
                className="w-full rounded-[var(--r-md)] bg-surface/70 px-2.5 py-1.5 text-left ring-1 ring-line transition-colors hover:bg-surface hover:ring-forest-line"
              >
                <span className="block text-[13px] font-semibold leading-[18px] text-ink">{campaign.label}</span>
                {campaign.hint ? <span className="block text-[11px] leading-4 text-muted">{campaign.hint}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Two overlapping cards: the Partner Template group. */
function IconPartner() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.75" y="5.75" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.75 3.75h7.5a2 2 0 0 1 2 2v7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 9.5h5M5.5 12.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 3.5h8v4a4 4 0 0 1-8 0v-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 5H3.5v1a3 3 0 0 0 2.8 3M14 5h2.5v1a3 3 0 0 1-2.8 3M10 11.5v3M7 16.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
