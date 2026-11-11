import type {
  AgendaItem,
  Campaign,
  CampaignBundle,
  EventRow,
  MasterType,
  SpotlightCard,
} from '../../types'
import { usesDesign } from '../../types'
import { MASTER_LABEL } from '../../types'
import type { AgentFill, CampaignKey } from './schema'
import { t } from '../i18n'

const FIELD_LABEL: Record<CampaignKey, string> = {
  get name() {
    return t("Studio name")
  },
  get subject() {
    return t("Email subject")
  },
  get region() {
    return t("Region")
  },
  get kicker() {
    return t("Region kicker")
  },
  get title() {
    return t("Title")
  },
  get greeting() {
    return t("Greeting")
  },
  get intro() {
    return t("Intro")
  },
  get event_name() {
    return t("Event name")
  },
  get event_url() {
    return t("Event link")
  },
  get event_date_label() {
    return t("Date")
  },
  get event_time_label() {
    return t("Time")
  },
  get language_note() {
    return t("Language note")
  },
  get overview_body() {
    return t("Overview")
  },
  get action_heading() {
    return t("Action heading")
  },
  get action_body() {
    return t("Action body")
  },
  get register_label() {
    return t("Register label")
  },
  get register_url() {
    return t("Register link")
  },
  get secondary_cta_label() {
    return t("Second button label")
  },
  get secondary_cta_url() {
    return t("Second button link")
  },
  get signoff_thanks() {
    return t("Sign-off")
  },
  get signer_name() {
    return t("Signer name")
  },
  get signer_title() {
    return t("Signer title")
  },
  get signer_email() {
    return t("Signer email")
  },
  get month_label() {
    return t("Month")
  },
  get subtitle() {
    return t("Subtitle")
  },
  get contents_intro() {
    return t("Contents intro")
  },
  get snapshot_date() {
    return t("Snapshot date")
  },
  get callouts() {
    return t("Callouts")
  },
}

export type FieldChange = {
  label: string
  before: string
  after: string
}

/** Text fields each template actually uses (form plus rendered email). */
const FIELDS_BY_MASTER: Record<MasterType, CampaignKey[]> = {
  // Banner text only; body blocks and footer are edited by hand.
  newsletter: ['name', 'subject', 'kicker', 'title', 'subtitle', 'register_label', 'register_url'],
  custom2: ['name', 'subject', 'kicker', 'title', 'subtitle', 'register_label', 'register_url'],
  hackathon: ['name', 'subject', 'kicker', 'title', 'subtitle', 'register_label', 'register_url'],
  event_invite: [
    'name', 'subject', 'region', 'kicker', 'title', 'greeting', 'intro',
    'event_name', 'event_url', 'event_date_label', 'event_time_label',
    'language_note', 'overview_body', 'action_heading', 'action_body',
    'register_label', 'register_url', 'secondary_cta_label', 'secondary_cta_url',
    'signoff_thanks', 'signer_name', 'signer_title', 'signer_email',
  ],
  monthly_update: [
    'name', 'subject', 'title', 'month_label', 'subtitle', 'intro', 'action_body',
    'contents_intro', 'signoff_thanks', 'signer_name', 'signer_title', 'signer_email',
  ],
  weekly_snapshot: [
    'name', 'subject', 'title', 'snapshot_date', 'greeting', 'intro', 'callouts',
    'overview_body', 'action_body', 'register_label', 'register_url',
    'secondary_cta_label', 'secondary_cta_url',
  ],
}

/** Table sections each template shows. */
const SECTIONS_BY_MASTER: Record<MasterType, string[]> = {
  newsletter: [],
  custom2: [],
  hackathon: [],
  event_invite: [],
  monthly_update: ['virtual_skilling', 'on_demand'],
  weekly_snapshot: ['new_requests', 'work_in_progress', 'completed'],
}

const USES_AGENDA: Record<MasterType, boolean> = {
  newsletter: false,
  custom2: false,
  hackathon: false,
  event_invite: true,
  monthly_update: false,
  weekly_snapshot: false,
}

const USES_SPOTLIGHTS: Record<MasterType, boolean> = {
  newsletter: false,
  custom2: false,
  hackathon: false,
  event_invite: false,
  monthly_update: true,
  weekly_snapshot: false,
}

/**
 * The email as the agent should see it: only what the current template uses,
 * without database ids, so it can edit what is there instead of guessing.
 */
export function emailForAgent(bundle: CampaignBundle) {
  const master = bundle.campaign.master_type
  const fields: Partial<Record<CampaignKey, string>> = {}
  for (const key of FIELDS_BY_MASTER[master]) fields[key] = bundle.campaign[key] ?? ''
  const sections = SECTIONS_BY_MASTER[master]
  return {
    master_type: master,
    fields,
    ...(USES_AGENDA[master]
      ? { agenda: sorted(bundle.agenda).map((item) => item.text) }
      : {}),
    ...(USES_SPOTLIGHTS[master]
      ? {
          spotlights: sorted(bundle.spotlights).map((card) => ({
            headline: card.headline,
            image_url: card.image_url,
            body: card.body,
            bullets: card.bullets,
            cta_label: card.cta_label,
            cta_url: card.cta_url,
          })),
        }
      : {}),
    ...(sections.length
      ? {
          rows: sorted(bundle.rows)
            .filter((row) => sections.includes(row.section))
            .map((row) => ({
              section: row.section,
              title: row.title,
              title_url: row.title_url,
              col_a: row.col_a,
              col_b: row.col_b,
              col_c: row.col_c,
              col_d: row.col_d,
              col_e: row.col_e,
              col_f: row.col_f,
              col_g: row.col_g,
              highlight: row.highlight,
            })),
        }
      : {}),
  }
}

function sorted<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order)
}

function switchesTemplate(current: CampaignBundle, fill: AgentFill): MasterType | null {
  return fill.master_type && fill.master_type !== current.campaign.master_type
    ? fill.master_type
    : null
}

/**
 * Fields that mean the same thing in every template. Everything else (for
 * example action_body: the invite's action block vs the snapshot's "Working
 * with Delightful" text) belongs to the old email and is cleared on a switch.
 */
const SAME_MEANING = new Set<CampaignKey>([
  'name',
  'greeting',
  'signoff_thanks',
  'signer_name',
  'signer_title',
  'signer_email',
])

/** Fields left over from the old template when the agent switches templates. */
function leftoverFields(current: CampaignBundle, next: MasterType, fill: AgentFill): CampaignKey[] {
  const keep = new Set(FIELDS_BY_MASTER[next].filter((key) => SAME_MEANING.has(key)))
  return FIELDS_BY_MASTER[current.campaign.master_type].filter(
    (key) => !keep.has(key) && fill.fields[key] === undefined && Boolean(current.campaign[key]),
  )
}

export function applyFill(current: CampaignBundle, fill: AgentFill): CampaignBundle {
  const next = switchesTemplate(current, fill)
  const master = next ?? current.campaign.master_type

  const cleared: Partial<Campaign> = {}
  if (next) for (const key of leftoverFields(current, next, fill)) cleared[key] = ''
  // Uploaded banner art belongs to the invite and the newsletter; the
  // Section-1 image to the invite only.
  if (next && next !== 'event_invite' && !usesDesign(next)) cleared.banner_image = ''
  if (next && next !== 'event_invite') cleared.section_image = ''

  const campaign: Campaign = {
    ...current.campaign,
    ...cleared,
    ...fill.fields,
    master_type: master,
    updated_at: new Date().toISOString(),
  }
  const id = campaign.id

  let agenda = current.agenda
  if (fill.agenda) {
    agenda = fill.agenda.map(
      (item, sort_order): AgendaItem => ({
        id: crypto.randomUUID(),
        campaign_id: id,
        sort_order,
        text: item.text,
      }),
    )
  } else if (next && !USES_AGENDA[next]) {
    agenda = []
  }

  let spotlights = current.spotlights
  if (fill.spotlights) {
    spotlights = fill.spotlights.map(
      (card, sort_order): SpotlightCard => ({
        id: crypto.randomUUID(),
        campaign_id: id,
        sort_order,
        ...card,
      }),
    )
  } else if (next && !USES_SPOTLIGHTS[next]) {
    spotlights = []
  }

  // Replace only the table sections the agent sent; keep the others.
  let rows = current.rows
  if (next) rows = rows.filter((row) => SECTIONS_BY_MASTER[next].includes(row.section))
  if (fill.rows) {
    const replaced = new Set(fill.rows.map((row) => row.section))
    const counts: Record<string, number> = {}
    rows = [
      ...rows.filter((row) => !replaced.has(row.section)),
      ...fill.rows.map((row): EventRow => {
        const sort_order = counts[row.section] ?? 0
        counts[row.section] = sort_order + 1
        return { id: crypto.randomUUID(), campaign_id: id, sort_order, ...row }
      }),
    ]
  }

  return { campaign, agenda, spotlights, rows }
}

export function changesFor(current: CampaignBundle, fill: AgentFill): FieldChange[] {
  const changes: FieldChange[] = []
  const next = switchesTemplate(current, fill)
  if (next) {
    changes.push({
      label: t("Template"),
      before: MASTER_LABEL[current.campaign.master_type],
      after: MASTER_LABEL[next],
    })
  }
  for (const key of Object.keys(fill.fields) as CampaignKey[]) {
    const after = fill.fields[key] ?? ''
    const before = current.campaign[key] ?? ''
    if (after !== before) changes.push({ label: FIELD_LABEL[key], before, after })
  }
  if (next) {
    const leftovers = leftoverFields(current, next, fill)
    const lists = [
      next !== 'event_invite' && !usesDesign(next) && current.campaign.banner_image ? t("Banner art") : '',
      next !== 'event_invite' && current.campaign.section_image ? t("Section-1 image") : '',
      !fill.agenda && !USES_AGENDA[next] && current.agenda.length ? t("Agenda") : '',
      !fill.spotlights && !USES_SPOTLIGHTS[next] && current.spotlights.length ? t("Spotlight cards") : '',
      current.rows.some((row) => !SECTIONS_BY_MASTER[next].includes(row.section)) ? t("Old table rows") : '',
    ].filter(Boolean)
    const removed = [...leftovers.map((key) => FIELD_LABEL[key]), ...lists]
    if (removed.length) {
      changes.push({
        label: t("Cleared from the previous template"),
        before: removed.join(', '),
        after: '',
      })
    }
  }
  if (fill.agenda) {
    const before = sorted(current.agenda).map((item) => item.text).join('\n')
    const after = fill.agenda.map((item) => item.text).join('\n')
    if (before !== after) changes.push({ label: t("Agenda"), before, after })
  }
  if (fill.spotlights) {
    const key = (card: { headline: string; body: string; bullets: string; cta_label: string; cta_url: string }) =>
      [card.headline, card.body, card.bullets, card.cta_label, card.cta_url].join('\u0000')
    const before = sorted(current.spotlights).map(key).join('\n')
    const after = fill.spotlights.map(key).join('\n')
    if (before !== after) {
      changes.push({
        label: t("Spotlight cards"),
        before: sorted(current.spotlights).map((card) => card.headline).join('\n') || t("(none)"),
        after: fill.spotlights.map((card) => card.headline).join('\n') || t("(none)"),
      })
    }
  }
  if (fill.rows) {
    const rowKey = (row: Omit<EventRow, 'id' | 'campaign_id' | 'sort_order'>) =>
      [row.title, row.title_url, row.col_a, row.col_b, row.col_c, row.col_d, row.col_e, row.col_f, row.col_g, row.highlight].join('\u0000')
    for (const section of [...new Set(fill.rows.map((row) => row.section))]) {
      const beforeRows = sorted(current.rows).filter((row) => row.section === section)
      const afterRows = fill.rows.filter((row) => row.section === section)
      if (beforeRows.map(rowKey).join('\n') === afterRows.map(rowKey).join('\n')) continue
      changes.push({
        label: t("Table: {name}", { name: SECTION_LABEL[section] ?? section }),
        before: beforeRows.map((row) => row.title).filter(Boolean).join('\n') || t("(none)"),
        after: afterRows.map((row) => row.title).filter(Boolean).join('\n') || t("(none)"),
      })
    }
  }
  return changes
}

const SECTION_LABEL: Record<string, string> = {
  get virtual_skilling() {
    return t("Virtual Skilling")
  },
  get on_demand() {
    return t("On-Demand Skilling")
  },
  get new_requests() {
    return t("New requests")
  },
  get work_in_progress() {
    return t("Work in progress")
  },
  get completed() {
    return t("Completed projects")
  },
}
