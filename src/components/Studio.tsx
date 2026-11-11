import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useResizableWidth } from '../hooks/useResizableWidth'
import { AskCopilotContext } from '../lib/askCopilot'
import { copyForOutlook, downloadEml, downloadOft } from '../lib/exports'
import { deleteUserTemplate, listUserTemplates, saveUserTemplate, type UserTemplate } from '../data/userTemplates'
import {
  createCampaign,
  createFromStarter,
  createFromUserTemplate,
  deleteCampaign,
  duplicateCampaign,
  getBundle,
  listCampaigns,
  saveBundle,
} from '../lib/repo'
import { readDesign } from '../lib/newsletter'
import type { Campaign, CampaignBundle, MasterType } from '../types'
import { usesDesign } from '../types'
import { AgentPanel, type NewEmailChoice } from './AgentPanel'
import { CampaignActions, CampaignSwitcher } from './CampaignSwitcher'
import { DownloadButton } from './DownloadButton'
import { FieldForm } from './FieldForm'
import { IconCheck, IconClose, IconCopy, IconSaved, IconWarning, MicrosoftMark } from './Icons'
import { PreviewPane } from './PreviewPane'

type MobilePane = 'fields' | 'preview' | 'agent'
type SaveState = 'saved' | 'saving' | 'error'

/** One message bar under the header: a result, a warning, or an error. */
type Status = {
  tone: 'success' | 'warn' | 'error'
  text: string
  action?: { label: string; run: () => void }
}

const STATUS_STYLE: Record<Status['tone'], string> = {
  success: 'border-forest-line bg-forest-soft text-ink',
  warn: 'border-warn-line bg-warn-bg text-ink',
  error: 'border-danger-line bg-danger-bg text-ink',
}

const STATUS_ICON: Record<Status['tone'], string> = {
  success: 'text-success',
  warn: 'text-warn',
  error: 'text-danger',
}

const PANES: [MobilePane, string][] = [
  ['fields', 'Fields'],
  ['preview', 'Preview'],
  ['agent', 'Copilot'],
]

/** Fields an email can't go out without. Checked before every download. */
function unfinishedFields(next: CampaignBundle): string[] {
  const missing: string[] = []
  if (!next.campaign.subject.trim()) missing.push('Subject')
  if (usesDesign(next.campaign.master_type)) {
    // A full-image banner can carry the headline in the picture itself.
    const fullImage = readDesign(next.campaign).banner.layout === 'image' && next.campaign.banner_image
    if (!fullImage && !next.campaign.title.trim()) missing.push('Headline')
    return missing
  }
  if (!next.campaign.title.trim()) missing.push('Title')
  return missing
}

export function Studio() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [bundle, setBundle] = useState<CampaignBundle | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const statusTimer = useRef<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [mobilePane, setMobilePane] = useState<MobilePane>('fields')
  const [focusRequest, setFocusRequest] = useState<{ anchor: string; key: number } | null>(null)
  const [prefill, setPrefill] = useState<{ text: string; key: number } | null>(null)
  const saveTimer = useRef<number | null>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  /** "Fill with Copilot" on a form section: a starting prompt in the Copilot box. */
  function askCopilot(section: string) {
    setPrefill({ text: `Fill in “${section}”: `, key: Date.now() })
    if (!isDesktop) setMobilePane('agent')
  }

  /** Click on a block of the preview: show the form section that edits it. */
  function editSection(anchor: string) {
    setFocusRequest({ anchor, key: Date.now() })
    if (!isDesktop) setMobilePane('fields')
  }

  function show(next: Status | null) {
    if (statusTimer.current) window.clearTimeout(statusTimer.current)
    setStatus(next)
    // Confirmations fade on their own; warnings and errors wait to be closed.
    if (next?.tone === 'success') statusTimer.current = window.setTimeout(() => setStatus(null), 7000)
  }

  function setError(text: string) {
    show(text ? { tone: 'error', text } : null)
  }

  async function handleDownload(kind: 'oft' | 'eml', next: CampaignBundle, checked = false) {
    const missing = checked ? [] : unfinishedFields(next)
    if (missing.length) {
      show({
        tone: 'warn',
        text: `${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} empty. The email would go out without ${missing.length > 1 ? 'them' : 'it'}.`,
        action: { label: 'Download anyway', run: () => void handleDownload(kind, next, true) },
      })
      return
    }
    try {
      if (kind === 'oft') {
        const name = await downloadOft(next)
        show({ tone: 'success', text: `Downloaded ${name}. Double-click it to open the email in classic Outlook for Windows.` })
      } else {
        const name = downloadEml(next)
        show({ tone: 'success', text: `Downloaded ${name}. Open it in Outlook for Mac, new Outlook, or another mail app.` })
      }
    } catch {
      setError(`Could not build the .${kind} file. Try again, or use Copy for Outlook instead.`)
    }
  }

  async function handleCopyForOutlook(next: CampaignBundle) {
    try {
      await copyForOutlook(next)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      show({ tone: 'success', text: 'Copied. Paste it into the body of a new Outlook email.' })
    } catch {
      setError('Could not copy the email. Your browser may not allow clipboard access here.')
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await listCampaigns()
        if (cancelled) return
        setCampaigns(list)
        // Open the email worked on most recently.
        const latest = [...list].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))[0]
        if (latest) {
          const next = await getBundle(latest.id)
          if (!cancelled) setBundle(next)
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not load campaigns')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function queueSave(next: CampaignBundle) {
    setBundle(next)
    setSaveState('saving')
    setCampaigns((current) =>
      current.map((row) =>
        row.id === next.campaign.id ? { ...next.campaign, updated_at: new Date().toISOString() } : row,
      ),
    )
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(async () => {
      try {
        await saveBundle(next)
        setSaveState('saved')
      } catch (caught) {
        setSaveState('error')
        setError(caught instanceof Error ? caught.message : 'Could not save your changes.')
      }
    }, 450)
  }

  async function onSelect(id: string) {
    setError('')
    const next = await getBundle(id)
    setBundle(next)
  }

  async function onCreate(master: MasterType) {
    try {
      const created = await createCampaign(master)
      setCampaigns((current) => [...current, created.campaign])
      setBundle(created)
      setMobilePane('fields')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the campaign.')
    }
  }

  async function onCreateStarter(starterId: string) {
    try {
      const created = await createFromStarter(starterId)
      setCampaigns((current) => [...current, created.campaign])
      setBundle(created)
      setMobilePane('fields')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start from that template.')
    }
  }

  /** The four choices on the left: three masters, and Custom (the ME7 layout). */
  function onNew(choice: NewEmailChoice) {
    if (choice === 'custom') void onCreateStarter('me7')
    else if (choice === 'custom2') void onCreateStarter('custom2')
    else if (choice === 'event_invite' || choice === 'monthly_update' || choice === 'weekly_snapshot') void onCreate(choice)
    else void onCreateStarter(choice)
  }

  // Templates saved with "Save as template" (Custom 2), kept in this browser.
  const [templates, setTemplates] = useState<UserTemplate[]>(() => listUserTemplates())

  function onSaveTemplate(name: string) {
    if (!bundle) return
    try {
      const saved = saveUserTemplate(bundle, name)
      setTemplates(listUserTemplates())
      show({ tone: 'success', text: `Saved “${saved.name}” to Your templates. Start new emails from it on the left.` })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the template.')
    }
  }

  async function onUseTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId)
    if (!template) return
    try {
      const created = await createFromUserTemplate(template)
      setCampaigns((current) => [...current, created.campaign])
      setBundle(created)
      setMobilePane('fields')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start from that template.')
    }
  }

  function onDeleteTemplate(templateId: string) {
    try {
      setTemplates(deleteUserTemplate(templateId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete the template.')
    }
  }

  // "All campaigns" in Custom 2 opens the campaign list at the top.
  const [listSignal, setListSignal] = useState(0)

  /** "Use as a sample" on a recent email: a copy to start the new one from. */
  async function onCopy(id: string) {
    try {
      const source = bundle && bundle.campaign.id === id ? bundle : await getBundle(id)
      if (!source) return
      const copy = await duplicateCampaign(source)
      setCampaigns((current) => [...current, copy.campaign])
      setBundle(copy)
      setMobilePane('fields')
      show({ tone: 'success', text: `Started a new email from “${source.campaign.name}”. You are editing the copy.` })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not copy that email.')
    }
  }

  async function onDuplicate() {
    if (!bundle) return
    try {
      const copy = await duplicateCampaign(bundle)
      setCampaigns((current) => [...current, copy.campaign])
      setBundle(copy)
      show({ tone: 'success', text: `Duplicated. You are now editing “${copy.campaign.name}”.` })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not duplicate the campaign.')
    }
  }

  async function onDelete() {
    if (!bundle) return
    const ok = window.confirm(`Delete “${bundle.campaign.name}”?`)
    if (!ok) return
    await deleteCampaign(bundle.campaign.id)
    const remaining = campaigns.filter((row) => row.id !== bundle.campaign.id)
    setCampaigns(remaining)
    if (remaining[0]) setBundle(await getBundle(remaining[0].id))
    else setBundle(null)
  }

  // Fields on the left, the email in the middle, Copilot docked on the right
  // the way it sits in Word and Outlook. Both side panes drag-resize, or take
  // arrow keys once their handle has focus.
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth
  const formPanel = useResizableWidth(Math.round(Math.max(320, Math.min(420, viewportWidth * 0.28))), 300, 640)
  const agentPanel = useResizableWidth(
    Math.round(Math.max(300, Math.min(380, viewportWidth * 0.25))),
    280,
    560,
  )

  const switcher = (
    <div className="flex min-w-0 items-center gap-0.5">
      <CampaignSwitcher
        campaigns={campaigns}
        currentId={bundle?.campaign.id ?? null}
        onSelect={(id) => void onSelect(id)}
        openSignal={listSignal}
      />
      {bundle ? <CampaignActions onDuplicate={() => void onDuplicate()} onDelete={() => void onDelete()} /> : null}
    </div>
  )

  const copyButton = bundle ? (
    <button
      type="button"
      className="ui-btn ui-btn-primary w-full sm:w-auto"
      onClick={() => void handleCopyForOutlook(bundle)}
    >
      {copied ? <IconCheck /> : <IconCopy />}
      <span className="flex flex-col items-start">
        <span>{copied ? 'Copied' : 'Copy for Outlook'}</span>
        {/* Wide screens only: says where the copy goes. */}
        <span className="hidden text-[11px] font-normal leading-4 opacity-80 xl:block">
          Paste into the Outlook email body
        </span>
      </span>
    </button>
  ) : null

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink">
      <header className="flex h-15 shrink-0 xl:h-[72px] items-center gap-2 border-b border-line bg-surface px-3 sm:gap-3 sm:px-5">
        <div className="flex shrink-0 items-center gap-3 sm:pr-1">
          <MicrosoftMark className="h-6 w-6 shrink-0" />
          <div className="hidden min-w-0 md:block">
            <h1 className="text-[18px] font-semibold leading-6 whitespace-nowrap text-ink">
              Newsletter Studio
            </h1>
            <p className="hidden text-[12px] leading-4 whitespace-nowrap text-muted xl:block">
              Microsoft Partner Skilling Outlook emails: design, preview live, export .oft
            </p>
          </div>
        </div>
        <span className="hidden h-6 w-px shrink-0 bg-line-strong md:block" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          {switcher}
          {bundle ? <SaveIndicator state={saveState} /> : null}
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {bundle ? (
            <DownloadButton
              onOft={() => void handleDownload('oft', bundle)}
              onEml={() => void handleDownload('eml', bundle)}
            />
          ) : null}
          {copyButton}
        </div>
      </header>

      <div role="status" aria-live="polite">
        {status ? (
          <div
            className={
              'flex items-center gap-2.5 border-b px-3 py-1.5 text-[14px] leading-5 sm:px-4 ' + STATUS_STYLE[status.tone]
            }
          >
            <span className={'shrink-0 ' + STATUS_ICON[status.tone]}>
              {status.tone === 'success' ? <IconCheck /> : <IconWarning />}
            </span>
            <p className="min-w-0 flex-1 py-0.5">{status.text}</p>
            {status.action ? (
              <button type="button" className="ui-btn ui-btn-ghost min-h-7 shrink-0 py-0.5" onClick={status.action.run}>
                {status.action.label}
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Close message"
              className="ui-icon-btn -mr-1 h-7 w-7 text-ink-2"
              onClick={() => show(null)}
            >
              <IconClose />
            </button>
          </div>
        ) : null}
      </div>

      {/* Below desktop width: one pane at a time. */}
      {bundle ? (
        <div className="shrink-0 border-b border-line bg-surface px-2 lg:hidden">
          <div role="tablist" aria-label="Studio panes" className="flex gap-1" onKeyDown={onTabKey}>
            {PANES.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`pane-tab-${id}`}
                aria-selected={mobilePane === id}
                aria-controls={`pane-${id}`}
                tabIndex={mobilePane === id ? 0 : -1}
                className={
                  'relative px-3 py-2.5 text-[14px] leading-5 transition-colors ' +
                  (mobilePane === id
                    ? 'font-semibold text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-forest'
                    : 'text-muted hover:text-ink')
                }
                onClick={() => setMobilePane(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {bundle ? (
          <>
            {/* Same order as the original studio: Copilot, Fields, Preview. */}
            <aside
              id="pane-agent"
              aria-label="Copilot"
              className={
                (mobilePane === 'agent' ? 'flex' : 'hidden') +
                ' min-h-0 w-full flex-1 flex-col lg:flex lg:w-auto lg:flex-none lg:shrink-0'
              }
              style={isDesktop ? { width: agentPanel.width } : undefined}
            >
              <AgentPanel
                bundle={bundle}
                onApply={queueSave}
                prefill={prefill}
                campaigns={campaigns}
                onNew={onNew}
                onOpen={(id) => void onSelect(id)}
                onCopy={(id) => void onCopy(id)}
                templates={templates}
                onUseTemplate={(id) => void onUseTemplate(id)}
                onDeleteTemplate={onDeleteTemplate}
              />
            </aside>

            <div className="resize-handle hidden lg:block" {...agentPanel.handleProps('Resize Copilot pane')} />

            <section
              id="pane-fields"
              aria-label="Fields"
              className={
                (mobilePane === 'fields' ? 'flex' : 'hidden') +
                ' min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface lg:flex lg:w-auto lg:flex-none lg:shrink-0'
              }
              style={isDesktop ? { width: formPanel.width } : undefined}
            >
              <AskCopilotContext.Provider value={askCopilot}>
                <FieldForm
                  bundle={bundle}
                  onChange={queueSave}
                  focusRequest={focusRequest}
                  onShowCampaigns={() => setListSignal((n) => n + 1)}
                  onSaveTemplate={onSaveTemplate}
                />
              </AskCopilotContext.Provider>
            </section>

            <div className="resize-handle hidden lg:block" {...formPanel.handleProps('Resize fields pane')} />

            <section
              id="pane-preview"
              aria-label="Email preview"
              className={
                (mobilePane === 'preview' ? 'flex' : 'hidden') +
                ' min-h-0 w-full min-w-0 flex-1 flex-col bg-surface lg:flex'
              }
            >
              <PreviewPane bundle={bundle} onPickSection={editSection} />
            </section>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
              <h2 className="text-[18px] font-semibold leading-6 text-ink">What email are we building?</h2>
              <p className="mt-1 text-muted">Start a new email from a template.</p>
              <div className="mt-4 grid gap-2">
                {(
                  [
                    ['event_invite', 'Partner Template: Regional Template'],
                    ['monthly_update', 'Partner Template: Partner Skilling Update Template'],
                    ['weekly_snapshot', 'Partner Template: Weekly Project Snapshot'],
                    ['custom', 'Partner Template: Custom'],
                    ['custom2', 'Custom 2'],
                    ['hackathon-registration', 'Hackathons: Registration Confirmation'],
                  ] as [NewEmailChoice, string][]
                ).map(([choice, label]) => (
                  <button key={choice} type="button" className="ui-btn ui-btn-ghost w-full" onClick={() => onNew(choice)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {bundle ? (
        <div className="flex shrink-0 items-stretch gap-2 border-t border-line bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden">
          <div className="min-w-0 flex-1">{copyButton}</div>
          <DownloadButton
            compact
            menuAbove
            onOft={() => void handleDownload('oft', bundle)}
            onEml={() => void handleDownload('eml', bundle)}
          />
        </div>
      ) : null}
    </div>
  )

  function onTabKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const order = PANES.map(([id]) => id)
    const index = order.indexOf(mobilePane)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % order.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + order.length) % order.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = order.length - 1
    else return
    event.preventDefault()
    setMobilePane(order[next])
    document.getElementById(`pane-tab-${order[next]}`)?.focus()
  }
}

/** Autosave made visible, the way Office shows it beside the file name. */
function SaveIndicator({ state }: { state: SaveState }) {
  const label = state === 'saving' ? 'Saving…' : state === 'error' ? 'Not saved' : 'Saved'
  return (
    <span
      className={
        'flex shrink-0 items-center gap-1.5 text-[12px] leading-4 ' +
        (state === 'error' ? 'text-danger' : 'text-muted')
      }
      title={state === 'saved' ? 'All changes saved' : undefined}
    >
      {state === 'error' ? <IconWarning /> : <IconSaved />}
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </span>
  )
}
