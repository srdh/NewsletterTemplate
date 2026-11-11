import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AskCopilotContext } from '../lib/askCopilot'
import { GLOBE_PNG } from '../lib/globe'
import { IMAGE_ACCEPT, ImageProblem, prepareImage } from '../lib/images'
import type {
  Campaign,
  CampaignBundle,
  EventRow,
  SpotlightCard,
} from '../types'
import { MASTER_LABEL, usesBlockList } from '../types'
import { SECTION_TABS } from '../lib/sections'
import { IconChevron, IconSpark, IconTrash } from './Icons'
import { NewsletterFields } from './NewsletterFields'
import { OutlineFields } from './OutlineFields'
import { t } from '../lib/i18n'
import { emailLang, emailT, setEditingEmailLang } from '../lib/emailText'
import { EmailLanguageField } from './EmailLanguageField'

/** Shown under text boxes that accept links. */
const LINK_HINT = 'To add a link, write [link text](https://…)'
const linkHint = () => t(LINK_HINT)

export function Field({
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  hint?: string
}) {
  const shared =
    'ui-field'
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-muted">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={`${shared} min-h-[96px] resize-y leading-5`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      )}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  )
}

/** Upload slot for an email image, with a preview and replace / remove. */
export function ImageField({
  label,
  hint,
  value,
  fallback,
  fallbackLabel,
  maxWidth,
  onChange,
}: {
  label: string
  hint: string
  value: string
  fallback?: string
  fallbackLabel: string
  maxWidth: number
  onChange: (value: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')
  const shown = value || fallback

  async function pick(file: File | undefined) {
    if (!file) return
    setProblem('')
    setBusy(true)
    try {
      onChange(await prepareImage(file, maxWidth))
    } catch (caught) {
      setProblem(caught instanceof ImageProblem ? caught.message : t("That image could not be added."))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1 block text-[12px] font-medium text-muted">{label}</span>
      <div className="flex items-center gap-3 rounded-[var(--r-sm)] bg-fill p-2.5">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-sm)] bg-surface ring-1 ring-line">
          {shown ? (
            <img src={shown} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[11px] text-muted">{t("No image")}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-4 text-muted">
            {busy ? t("Preparing image…") : value ? t("Your image") : fallbackLabel}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={busy}
              className="ui-btn ui-btn-ghost min-h-7 px-3 py-1 text-[12px]"
              onClick={() => input.current?.click()}
            >
              {value ? t("Replace") : t("Add image")}
            </button>
            {value ? (
              <button
                type="button"
                className="ui-btn ui-btn-ghost ui-btn-ghost-danger min-h-7 px-3 py-1 text-[12px]"
                onClick={() => onChange('')}
              >
                {t("Remove")}</button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={(event) => void pick(event.target.files?.[0])}
      />
      <span className="mt-1 block text-[11px] text-muted">{hint}</span>
      {problem ? <span className="mt-1 block text-[11px] text-danger">{problem}</span> : null}
    </div>
  )
}

/** Names a group of fields inside a section, e.g. the blocks of Event details. */
export function Subheading({ children }: { children: ReactNode }) {
  return <h4 className="pt-1 text-[13px] font-semibold leading-5 text-ink">{children}</h4>
}

export function Section({
  title,
  anchor,
  children,
  noCopilot,
}: {
  title: string
  anchor: string
  children: ReactNode
  /** Sections Copilot cannot fill (newsletter style, body blocks, footer). */
  noCopilot?: boolean
}) {
  const ask = useContext(AskCopilotContext)
  return (
    <section data-section={anchor} className="group/section border-b border-line py-6 last-of-type:border-b-0">
      <div className="mb-4 flex min-h-7 items-center justify-between gap-3">
        <h3 className="ui-section-title">{title}</h3>
        {/* Shown on the section you are hovering or working in (always on
            touch screens, which have no hover). */}
        {ask && anchor !== 'campaign' && !noCopilot ? (
          <button
            type="button"
            onClick={() => ask(title)}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-4 text-forest opacity-0 transition-[opacity,background-color] group-hover/section:opacity-100 group-focus-within/section:opacity-100 hover:bg-forest-soft focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <IconSpark className="scale-90" />
            {t("Fill with Copilot")}</button>
        ) : null}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5">{children}</div>
    </section>
  )
}

export function FieldForm({
  bundle,
  onChange,
  focusRequest,
  onShowCampaigns,
  onSaveTemplate,
}: {
  bundle: CampaignBundle
  onChange: (bundle: CampaignBundle) => void
  /** A click on the preview: scroll to this section and flash it. */
  focusRequest?: { anchor: string; key: number } | null
  /** Custom 2: "All campaigns" opens the campaign list at the top. */
  onShowCampaigns?: () => void
  /** Custom 2: "Save as template". */
  onSaveTemplate?: (name: string) => void
}) {
  const campaign = bundle.campaign
  // New blocks, rows, and cards start in this email's language.
  setEditingEmailLang(emailLang(campaign))
  const set = (patch: Partial<Campaign>) =>
    onChange({ ...bundle, campaign: { ...campaign, ...patch } })

  const tabs = SECTION_TABS[campaign.master_type]
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(tabs[0][0])

  // Highlight the tab for the section currently at the top of the form.
  const syncActive = useCallback(() => {
    const node = scroller.current
    // Hidden (phone tab not selected): nothing is laid out, so skip.
    if (!node || node.clientHeight === 0) return
    const sections = node.querySelectorAll<HTMLElement>('[data-section]')
    let current = sections[0]?.dataset.section ?? 'campaign'
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 4
    sections.forEach((section) => {
      if (section.offsetTop - node.scrollTop <= 32) current = section.dataset.section ?? current
    })
    if (atBottom && sections.length) current = sections[sections.length - 1].dataset.section ?? current
    setActive(current)
  }, [])

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
    syncActive()
  }, [campaign.id, campaign.master_type, syncActive])

  // Re-check when the pane is shown or resized (phone tabs, drag resize).
  useEffect(() => {
    const node = scroller.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => syncActive())
    observer.observe(node)
    return () => observer.disconnect()
  }, [syncActive])

  function jump(anchor: string) {
    const node = scroller.current
    const target = node?.querySelector<HTMLElement>(`[data-section="${anchor}"]`)
    if (!node || !target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollTo({ top: target.offsetTop, behavior: reduce ? 'auto' : 'smooth' })
    setActive(anchor)
  }

  // The preview asked for a section (click on a block of the email).
  const handled = useRef<number | null>(null)
  useEffect(() => {
    if (!focusRequest || handled.current === focusRequest.key) return
    handled.current = focusRequest.key
    jump(focusRequest.anchor)
    const target = scroller.current?.querySelector<HTMLElement>(
      `[data-section="${focusRequest.anchor}"]`,
    )
    if (!target) return
    target.classList.remove('section-flash')
    void target.offsetWidth // restart the animation if it is already running
    target.classList.add('section-flash')
    const done = () => target.classList.remove('section-flash')
    target.addEventListener('animationend', done, { once: true })
  })

  // Custom 2 edits one block at a time instead of a long form with tabs.
  if (usesBlockList(campaign.master_type)) {
    return (
      <>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="hidden text-[16px] font-semibold leading-[22px] text-ink lg:block">{t("Blocks")}</h2>
          <span
            title={t("Set when the campaign is created. For a different email type, start a new campaign.")}
            className="truncate rounded-full bg-forest-soft px-2.5 py-0.5 text-[12px] font-semibold leading-4 text-forest"
          >
            {MASTER_LABEL[campaign.master_type]}
          </span>
        </div>
        <OutlineFields
          key={campaign.id}
          bundle={bundle}
          set={set}
          focusRequest={focusRequest}
          onShowCampaigns={onShowCampaigns ?? (() => {})}
          onSaveTemplate={onSaveTemplate ?? (() => {})}
        />
      </>
    )
  }

  return (
    <>
      <div className="shrink-0 border-b border-line">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1 sm:px-6">
          <h2 className="hidden text-[16px] font-semibold leading-[22px] text-ink lg:block">{t("Fields")}</h2>
          {/* The email type is fixed when the campaign is created, so it is
              shown here as a label rather than a field. */}
          <span
            title={t("Set when the campaign is created. For a different email type, start a new campaign.")}
            className="truncate rounded-full bg-forest-soft px-2.5 py-0.5 text-[12px] font-semibold leading-4 text-forest"
          >
            {MASTER_LABEL[campaign.master_type]}
          </span>
        </div>
        <nav aria-label={t("Form sections")} className="tab-strip flex overflow-x-auto px-2.5 sm:px-4">
          {tabs.map(([anchor, label]) => (
            <button
              key={anchor}
              type="button"
              aria-current={active === anchor ? 'true' : undefined}
              onClick={() => jump(anchor)}
              className={
                'relative shrink-0 rounded-[var(--r-sm)] px-1.5 pt-2 pb-2.5 text-[13px] leading-[18px] whitespace-nowrap transition-colors hover:bg-fill ' +
                (active === anchor
                  ? 'font-semibold text-ink after:absolute after:inset-x-1.5 after:bottom-0 after:h-[3px] after:rounded-full after:bg-forest'
                  : 'text-muted hover:text-ink')
              }
            >
              {t(label)}
            </button>
          ))}
        </nav>
      </div>
    <div
      ref={scroller}
      onScroll={syncActive}
      className="app-scroll relative min-h-0 flex-1 overflow-auto px-4 pb-16 sm:px-6"
    >
      <Section title={t("Campaign")} anchor="campaign">
        <Field
          label={t("Campaign name")}
          hint={t("Only shown in this app, in the campaign list.")}
          value={campaign.name}
          onChange={(name) => set({ name })}
        />
        <Field label={t("Email subject")} value={campaign.subject} onChange={(subject) => set({ subject })} />
        <EmailLanguageField value={campaign.language} onChange={(language) => set({ language })} />
      </Section>

      {campaign.master_type === 'newsletter' ? <NewsletterFields key={campaign.id} bundle={bundle} set={set} /> : null}
      {campaign.master_type === 'event_invite' ? (
        <EventInviteFields bundle={bundle} set={set} onChange={onChange} />
      ) : null}
      {campaign.master_type === 'monthly_update' ? (
        <MonthlyFields bundle={bundle} set={set} onChange={onChange} />
      ) : null}
      {campaign.master_type === 'weekly_snapshot' ? (
        <WeeklyFields bundle={bundle} set={set} onChange={onChange} />
      ) : null}

    </div>
    </>
  )
}

function EventInviteFields({
  bundle,
  set,
  onChange,
}: {
  bundle: CampaignBundle
  set: (patch: Partial<Campaign>) => void
  onChange: (bundle: CampaignBundle) => void
}) {
  const c = bundle.campaign
  return (
    <>
      <Section title={t("Banner")} anchor="banner">
        <Field label={t("Region kicker")} value={c.kicker} onChange={(kicker) => set({ kicker })} />
        <Field label={t("Title")} value={c.title} onChange={(title) => set({ title })} />
        <Field label={t("Region")} value={c.region} onChange={(region) => set({ region })} />
        <ImageField
          label={t("Banner art")}
          hint={t("Shown to the right of the title. PNG or JPG; transparent PNGs work best.")}
          value={c.banner_image ?? ''}
          fallback={GLOBE_PNG}
          fallbackLabel={t("Default globe")}
          maxWidth={336}
          onChange={(banner_image) => set({ banner_image })}
        />
      </Section>
      <Section title={t("Body")} anchor="body">
        <Field label={t("Greeting")} value={c.greeting} onChange={(greeting) => set({ greeting })} />
        <Field
          label={t("Intro")}
          value={c.intro}
          multiline
          hint={linkHint()}
          onChange={(intro) => set({ intro })}
        />
      </Section>
      <Section title={t("Event details")} anchor="section1">
        <ImageField
          label={t("Event image (optional)")}
          hint={t("A wide image above the event overview, like an event graphic or speaker lineup.")}
          value={c.section_image ?? ''}
          fallbackLabel={t("No image")}
          maxWidth={1200}
          onChange={(section_image) => set({ section_image })}
        />
        <Subheading>{t("Event overview")}</Subheading>
        <Field label={t("Event name")} value={c.event_name} onChange={(event_name) => set({ event_name })} />
        <Field label={t("Event URL")} value={c.event_url} onChange={(event_url) => set({ event_url })} />
        <Field
          label={t("Date")}
          value={c.event_date_label}
          onChange={(event_date_label) => set({ event_date_label })}
        />
        <Field
          label={t("Time")}
          value={c.event_time_label}
          onChange={(event_time_label) => set({ event_time_label })}
        />
        <Field
          label={t("Language note")}
          value={c.language_note}
          multiline
          onChange={(language_note) => set({ language_note })}
        />
        <Field
          label={t("Overview copy")}
          value={c.overview_body}
          multiline
          hint={linkHint()}
          onChange={(overview_body) => set({ overview_body })}
        />
        <Repeatable
          title={t("Agenda")}
          addLabel={t("Add agenda item")}
          items={bundle.agenda}
          onChange={(agenda) => onChange({ ...bundle, agenda })}
          make={() => ({
            id: crypto.randomUUID(),
            campaign_id: c.id,
            sort_order: bundle.agenda.length,
            text: '',
          })}
          render={(item, update) => (
            <input
              value={item.text}
              aria-label={t("Agenda item")}
              placeholder={t("Agenda item")}
              onChange={(event) => update({ ...item, text: event.target.value })}
              className="ui-field"
            />
          )}
        />
        <Subheading>{t("Action block")}</Subheading>
        <Field
          label={t("Action heading")}
          value={c.action_heading}
          onChange={(action_heading) => set({ action_heading })}
        />
        <Field
          label={t("Action body")}
          value={c.action_body}
          multiline
          hint={linkHint()}
          onChange={(action_body) => set({ action_body })}
        />
      </Section>
      <SignatureFields campaign={c} set={set} title={t("Footer (MS Signature)")} anchor="footer" />
    </>
  )
}

function MonthlyFields({
  bundle,
  set,
  onChange,
}: {
  bundle: CampaignBundle
  set: (patch: Partial<Campaign>) => void
  onChange: (bundle: CampaignBundle) => void
}) {
  const c = bundle.campaign
  return (
    <>
      <Section title={t("Banner")} anchor="banner">
        <Field label={t("Month")} value={c.month_label} onChange={(month_label) => set({ month_label })} />
        <Field label={t("Subtitle")} value={c.subtitle} onChange={(subtitle) => set({ subtitle })} />
      </Section>
      <Section title={t("Body")} anchor="body">
        <Field
          label={t("Intro")}
          value={c.intro}
          multiline
          hint={linkHint()}
          onChange={(intro) => set({ intro })}
        />
        <Field
          label={t("Call to action")}
          value={c.action_body}
          multiline
          hint={linkHint()}
          onChange={(action_body) => set({ action_body })}
        />
      </Section>
      <Section title={t("Spotlight")} anchor="spotlight">
        <Repeatable
          title={t("Spotlight cards")}
          addLabel={t("Add card")}
          itemName={(item, index) => {
            const headline = item.headline.trim()
            return headline ? t('Card {n}: {headline}', { n: index + 1, headline }) : t('Card {n}', { n: index + 1 })
          }}
          summary={(item) => item.body.trim() || t("Empty card")}
          items={bundle.spotlights}
          onChange={(spotlights) => onChange({ ...bundle, spotlights })}
          make={() =>
            ({
              id: crypto.randomUUID(),
              campaign_id: c.id,
              sort_order: bundle.spotlights.length,
              headline: '',
              image_url: '',
              body: '',
              bullets: '',
              cta_label: emailT(emailLang(c))('Register now!'),
              cta_url: '',
            }) satisfies SpotlightCard
          }
          render={(item, update) => (
            <div className="grid gap-2">
              <RowInput
                label={t("Headline")}
                value={item.headline}
                onChange={(headline) => update({ ...item, headline })}
              />
              <RowInput
                label={t("Body")}
                multiline
                value={item.body}
                onChange={(body) => update({ ...item, body })}
              />
              <RowInput
                label={t("Bullets, one per line")}
                multiline
                value={item.bullets}
                onChange={(bullets) => update({ ...item, bullets })}
              />
              <RowInput
                label={t("Register URL")}
                value={item.cta_url}
                onChange={(cta_url) => update({ ...item, cta_url })}
              />
            </div>
          )}
        />
      </Section>
      <Section title={t("Upcoming events")} anchor="events">
        <RowEditor
          bundle={bundle}
          section="virtual_skilling"
          labels={[t("Event"), t("Focus"), t("Date and time")]}
          titleFirst
          onChange={onChange}
        />
        <RowEditor
          bundle={bundle}
          section="on_demand"
          labels={[t("Journey"), t("Focus"), t("Link")]}
          titleFirst
          onChange={onChange}
        />
      </Section>
      <SignatureFields
        campaign={c}
        set={set}
        title={t("Footer · Microsoft signature")}
        anchor="signature"
      />
    </>
  )
}

function WeeklyFields({
  bundle,
  set,
  onChange,
}: {
  bundle: CampaignBundle
  set: (patch: Partial<Campaign>) => void
  onChange: (bundle: CampaignBundle) => void
}) {
  const c = bundle.campaign
  return (
    <>
      <Section title={t("Header")} anchor="header">
        <Field
          label={t("Snapshot date")}
          value={c.snapshot_date}
          onChange={(snapshot_date) => set({ snapshot_date })}
        />
        <Field label={t("Greeting")} value={c.greeting} onChange={(greeting) => set({ greeting })} />
        <Field
          label={t("Intro")}
          value={c.intro}
          multiline
          hint={linkHint()}
          onChange={(intro) => set({ intro })}
        />
        <Field
          label={t("Weekly call outs")}
          value={c.callouts}
          multiline
          onChange={(callouts) => set({ callouts })}
        />
      </Section>
      <Section title={t("Tables")} anchor="tables">
        <RowEditor
          bundle={bundle}
          section="new_requests"
          labels={[t("Owner"), t("Initiative"), t("Request date"), t("Target due date"), t("Current status")]}
          extra
          onChange={onChange}
        />
        <RowEditor
          bundle={bundle}
          section="work_in_progress"
          labels={[t("Owner"), t("Initiative"), t("Planned delivery"), t("Current status"), t("Project quote")]}
          extra
          onChange={onChange}
        />
        <RowEditor
          bundle={bundle}
          section="completed"
          labels={[t("Owner"), t("Initiative"), t("Delivered date"), t("Notes on scope changes"), t("Final price")]}
          extra
          onChange={onChange}
        />
      </Section>
      <Section title={t("Footer")} anchor="footer">
        <Field
          label={t("Closing note")}
          hint={linkHint()}
          value={c.action_body}
          multiline
          onChange={(action_body) => set({ action_body })}
        />
        <Field
          label={t("Primary button")}
          value={c.register_label}
          onChange={(register_label) => set({ register_label })}
        />
        <Field label={t("Primary URL")} value={c.register_url} onChange={(register_url) => set({ register_url })} />
      </Section>
    </>
  )
}

function SignatureFields({
  campaign,
  set,
  title,
  anchor,
}: {
  campaign: Campaign
  set: (patch: Partial<Campaign>) => void
  title: string
  anchor: string
}) {
  return (
    <Section title={title} anchor={anchor}>
      <Field
        label={t("Thanks line")}
        value={campaign.signoff_thanks}
        onChange={(signoff_thanks) => set({ signoff_thanks })}
      />
      <Field
        label={t("Signer name")}
        value={campaign.signer_name}
        onChange={(signer_name) => set({ signer_name })}
      />
      <Field
        label={t("Signer title")}
        value={campaign.signer_title}
        onChange={(signer_title) => set({ signer_title })}
      />
      <Field
        label={t("Signer email")}
        value={campaign.signer_email}
        onChange={(signer_email) => set({ signer_email })}
      />
    </Section>
  )
}

function Repeatable<T extends { id: string }>({
  title,
  addLabel,
  items,
  onChange,
  make,
  render,
  itemName,
  emptyText,
  summary,
}: {
  title: string
  addLabel: string
  items: T[]
  onChange: (items: T[]) => void
  make: () => T
  render: (item: T, update: (item: T) => void) => ReactNode
  /** When given, each item is a card headed by this name. */
  itemName?: (item: T, index: number) => string
  emptyText?: string
  /** When given, cards collapse to their name plus this one-line summary. */
  summary?: (item: T) => ReactNode
}) {
  // Collapsible cards start closed; a row you just added starts open.
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold">{title}</span>
        <button
          type="button"
          onClick={() => {
            const item = make()
            if (summary) setOpenIds((current) => new Set(current).add(item.id))
            onChange([...items, item])
          }}
          className="text-[12px] font-semibold text-forest transition-colors hover:text-forest-deep hover:underline"
        >
          {addLabel}
        </button>
      </div>
      {items.length === 0 && emptyText ? <p className="text-[12px] leading-5 text-muted">{emptyText}</p> : null}
      <ul className="grid gap-2">
        {items.map((item, index) => {
          const updateItem = (next: T) => {
            const copy = [...items]
            copy[index] = next
            onChange(copy)
          }
          const name = itemName ? itemName(item, index) : `${title} ${index + 1}`
          const remove = (
            <button
              type="button"
              aria-label={t('Remove {name}', { name })}
              title={t('Remove {name}', { name })}
              className={`ui-icon-btn ui-icon-btn-danger self-start ${itemName && !summary ? '-my-1.5' : itemName ? '' : 'mt-[2px]'}`}
              onClick={() => onChange(items.filter((row) => row.id !== item.id))}
            >
              <IconTrash />
            </button>
          )
          if (itemName && summary) {
            const open = openIds.has(item.id)
            const bodyId = `row-body-${item.id}`
            return (
              <li key={item.id} className="@container rounded-[var(--r-md)] border border-line bg-surface">
                <div className="flex items-start gap-1 py-1 pr-1.5 pl-1">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={bodyId}
                    onClick={() => toggle(item.id)}
                    className="flex min-w-0 flex-1 items-start gap-1.5 rounded-[var(--r-sm)] px-1.5 py-1.5 text-left hover:bg-fill"
                  >
                    <IconChevron
                      className={'mt-0.5 shrink-0 text-muted transition-transform ' + (open ? 'rotate-0' : '-rotate-90')}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold leading-5 text-ink">{name}</span>
                      {!open ? (
                        <span className="block truncate text-[12px] leading-4 text-muted">{summary(item)}</span>
                      ) : null}
                    </span>
                  </button>
                  <span className="pt-1">{remove}</span>
                </div>
                {open ? (
                  <div id={bodyId} className="border-t border-line px-3 pt-2.5 pb-3">
                    {render(item, updateItem)}
                  </div>
                ) : null}
              </li>
            )
          }
          return itemName ? (
            <li key={item.id} className="@container rounded-[var(--r-md)] border border-line bg-surface px-3 pt-2 pb-3">
              <div className="mb-1.5 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-5 text-ink">{name}</p>
                {remove}
              </div>
              {render(item, updateItem)}
            </li>
          ) : (
            <li key={item.id} className="flex gap-2">
              <div className="min-w-0 flex-1">{render(item, updateItem)}</div>
              {remove}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** What each table is called in the email, instead of its storage key. */
const ROW_SECTION_TITLE: Record<string, string> = {
  get virtual_skilling() {
    return t("Virtual skilling events")
  },
  get on_demand() {
    return t("On-demand journeys")
  },
  get new_requests() {
    return t("New requests")
  },
  get work_in_progress() {
    return t("Work in progress")
  },
  get completed() {
    return t("Completed")
  },
}

type RowTextKey = 'title' | 'title_url' | 'col_a' | 'col_b' | 'col_c' | 'col_d' | 'col_e' | 'col_f' | 'col_g'

/** One labeled input inside a row card. */
function RowInput({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  /** Longer text (status, notes): wraps and grows instead of cutting off. */
  multiline?: boolean
}) {
  return (
    <label className={'block min-w-0' + (multiline ? ' @xs:col-span-2' : '')}>
      <span className="mb-0.5 block text-[12px] leading-4 text-muted">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={2}
          onChange={(event) => onChange(event.target.value)}
          className="ui-field ui-field-sm min-h-[52px] resize-y leading-5"
        />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="ui-field ui-field-sm" />
      )}
    </label>
  )
}

/** Columns whose text runs long in the email, so they get a growing box. */
const LONG_COLUMNS = new Set(['Initiative', 'Current status', 'Notes on scope changes'])

function RowEditor({
  bundle,
  section,
  labels,
  extra,
  titleFirst,
  onChange,
}: {
  bundle: CampaignBundle
  section: string
  labels: string[]
  extra?: boolean
  titleFirst?: boolean
  onChange: (bundle: CampaignBundle) => void
}) {
  // Column names come from the email's template, in English: show them in the studio language.
  labels = labels.map((label) => (label ? t(label) : label))
  const items = bundle.rows.filter((row) => row.section === section)
  const others = bundle.rows.filter((row) => row.section !== section)
  const update = (next: EventRow[]) => onChange({ ...bundle, rows: [...others, ...next] })

  // Same columns and order as before, now with visible labels.
  const fields: [RowTextKey, string][] = titleFirst
    ? [
        ['title', labels[0] || t("Title")],
        ['col_a', labels[1] || t("Focus")],
        ['col_b', labels[2] || t("Date")],
        ['title_url', t("Title link")],
      ]
    : [
        ['col_a', labels[0] || t("Owner")],
        ['title', labels[1] || t("Title")],
        ['col_b', labels[2] || t("Column")],
        ...(labels[3] ? ([['col_c', labels[3]]] as [RowTextKey, string][]) : []),
        ...(labels[4] ? ([['col_d', labels[4]]] as [RowTextKey, string][]) : []),
        ...(extra && section === 'new_requests'
          ? ([
              ['col_e', t("Project quote")],
              ['col_f', t("Project approval")],
              ['col_g', t("Budget tracking")],
            ] as [RowTextKey, string][])
          : []),
        ...(extra && section !== 'new_requests' ? ([['col_g', t("Budget tracking")]] as [RowTextKey, string][]) : []),
      ]
  // The card header names the row by what identifies it in the table.
  const nameKey: RowTextKey = titleFirst ? 'title' : 'col_a'

  return (
    <Repeatable
      title={ROW_SECTION_TITLE[section] ?? section.replaceAll('_', ' ')}
      addLabel={t("Add row")}
      emptyText={t("No rows yet. This table is left out of the email until you add one.")}
      itemName={(item, index) => {
        const name = item[nameKey].trim()
        return name ? t('Row {n}: {name}', { n: index + 1, name }) : t('Row {n}', { n: index + 1 })
      }}
      summary={(item) => {
        const line = (titleFirst ? item.col_a : item.title).trim()
        return line || t("Empty row")
      }}
      items={items}
      onChange={update}
      make={() => ({
        id: crypto.randomUUID(),
        campaign_id: bundle.campaign.id,
        sort_order: items.length,
        section,
        title: '',
        title_url: '',
        col_a: '',
        col_b: '',
        col_c: '',
        col_d: '',
        col_e: '',
        col_f: '',
        col_g: '',
        highlight: '',
      })}
      render={(item, setItem) => (
        <div className="grid gap-x-2 gap-y-2.5 @xs:grid-cols-2">
          {fields.map(([key, label]) => (
            <RowInput
              key={key}
              label={label}
              value={item[key]}
              onChange={(value) => setItem({ ...item, [key]: value })}
              multiline={[...LONG_COLUMNS].some((column) => t(column) === label)}
            />
          ))}
          {extra ? (
            <label className="block min-w-0">
              <span className="mb-0.5 block text-[12px] leading-4 text-muted">{t("Row highlight")}</span>
              <select
                value={item.highlight}
                onChange={(event) => setItem({ ...item, highlight: event.target.value })}
                className="ui-field ui-field-sm"
              >
                <option value="">{t("None")}</option>
                <option value="yellow">{t("Yellow")}</option>
                <option value="green">{t("Green")}</option>
                <option value="orange">{t("Orange")}</option>
              </select>
            </label>
          ) : null}
        </div>
      )}
    />
  )
}
