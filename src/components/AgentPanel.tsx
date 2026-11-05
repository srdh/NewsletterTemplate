import { useEffect, useRef, useState } from 'react'
import { applyFill, changesFor, emailForAgent, type FieldChange } from '../lib/agent/apply'
import {
  ProviderNotConnected,
  fillCampaign,
  type FillSource,
} from '../lib/agent/provider'
import type { AgentFill } from '../lib/agent/schema'
import type { CampaignBundle } from '../types'
import { IconCalendar, IconChevron, IconNewsletter, IconSend, IconSpark, IconTable } from './Icons'

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

const STARTER_CARDS = [
  { icon: <IconCalendar />, kind: 'Event invite' },
  { icon: <IconTable />, kind: 'Weekly snapshot' },
  { icon: <IconNewsletter />, kind: 'Monthly update' },
]

const STARTERS = [
  'Asia event invite for Build What’s Next on September 22, 9–10:15am IST',
  'Weekly project snapshot for GCPS Skilling with new OFT requests and budget callouts',
  'Monthly Partner Skilling Update focused on AI Workforce journeys',
]

export function AgentPanel({
  bundle,
  onApply,
  prefill,
}: {
  bundle: CampaignBundle
  onApply: (bundle: CampaignBundle) => void
  /** A starting prompt handed over by "Fill with Copilot" on a form section. */
  prefill?: { text: string; key: number } | null
}) {
  const [items, setItems] = useState<ChatItem[]>([])
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

  // Starters are always on screen: in full in the empty thread, then as three
  // one-line buttons above the prompt once a conversation has started.
  const starterList = (
    <div className="grid gap-1.5">
      {STARTERS.map((starter) => (
        <button
          key={starter}
          type="button"
          disabled={busy}
          title={hasChat ? starter : undefined}
          onClick={() => void send(starter)}
          className={
            'rounded-[var(--r-md)] border border-line bg-surface text-left text-ink-2 transition-colors hover:border-forest-line hover:bg-forest-soft hover:text-ink disabled:opacity-50 ' +
            (hasChat
              ? 'truncate px-3 py-1.5 text-[12px] leading-4'
              : 'px-3 py-2 text-[14px] leading-5')
          }
        >
          {starter}
        </button>
      ))}
    </div>
  )

  return (
    <section className="copilot-wash flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-13 shrink-0 items-center gap-2.5 px-4">
        <span className="copilot-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <IconSpark />
        </span>
        <h2 className="text-[15px] font-semibold leading-5 text-ink">Copilot</h2>
      </header>

      <div
        ref={thread}
        className="app-scroll min-h-0 flex-1 overflow-auto px-4 py-4"
      >
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="pt-6">
              <h3 className="text-[22px] font-semibold leading-7 tracking-[-0.01em] text-ink">
                What email are we <span className="copilot-text">building?</span>
              </h3>
              <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-ink-2">
                Describe it or pick a starter. Copilot fills the fields, and nothing changes until you apply.
              </p>
              <div className="mt-6 grid gap-2">
                {STARTERS.map((starter, index) => (
                  <button
                    key={starter}
                    type="button"
                    disabled={busy}
                    onClick={() => void send(starter)}
                    className="copilot-glass group flex items-start gap-3 rounded-[var(--r-lg)] p-3 text-left disabled:opacity-50"
                  >
                    <span className="copilot-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest">
                      {STARTER_CARDS[index].icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-5 text-ink">{STARTER_CARDS[index].kind}</span>
                      <span className="block text-[13px] leading-[18px] text-muted group-hover:text-ink-2">{starter}</span>
                    </span>
                  </button>
                ))}
              </div>
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
        {hasChat ? <div className="mb-2.5">{starterList}</div> : null}
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
