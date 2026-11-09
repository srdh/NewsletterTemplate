import type { MasterType } from '../../types'

const CAMPAIGN_KEYS = [
  'name',
  'subject',
  'region',
  'kicker',
  'title',
  'greeting',
  'intro',
  'event_name',
  'event_url',
  'event_date_label',
  'event_time_label',
  'language_note',
  'overview_body',
  'action_heading',
  'action_body',
  'register_label',
  'register_url',
  'secondary_cta_label',
  'secondary_cta_url',
  'signoff_thanks',
  'signer_name',
  'signer_title',
  'signer_email',
  'month_label',
  'subtitle',
  'contents_intro',
  'snapshot_date',
  'callouts',
] as const

export type CampaignKey = (typeof CAMPAIGN_KEYS)[number]

export type AgendaFill = { text: string }

export type SpotlightFill = {
  headline: string
  image_url: string
  body: string
  bullets: string
  cta_label: string
  cta_url: string
}

export type RowFill = {
  section: string
  title: string
  title_url: string
  col_a: string
  col_b: string
  col_c: string
  col_d: string
  col_e: string
  col_f: string
  col_g: string
  highlight: string
}

export type AgentFill = {
  /** What the agent says back to the person, in its own words. */
  reply?: string
  master_type?: MasterType
  fields: Partial<Record<CampaignKey, string>>
  agenda?: AgendaFill[]
  spotlights?: SpotlightFill[]
  rows?: RowFill[]
}

const MASTER_ALIASES: Record<string, MasterType> = {
  custom_2: 'custom2',
  hackathon: 'hackathon',
  hackathons: 'hackathon',
  custom2: 'custom2',
  newsletter_studio: 'newsletter',
  custom_newsletter: 'newsletter',
  event_invite: 'event_invite',
  regional_event_invite: 'event_invite',
  invite: 'event_invite',
  monthly_update: 'monthly_update',
  partner_skilling_update: 'monthly_update',
  newsletter: 'newsletter',
  weekly_snapshot: 'weekly_snapshot',
  weekly_project_snapshot: 'weekly_snapshot',
  snapshot: 'weekly_snapshot',
}

const ROW_KEYS = [
  'section',
  'title',
  'title_url',
  'col_a',
  'col_b',
  'col_c',
  'col_d',
  'col_e',
  'col_f',
  'col_g',
  'highlight',
] as const

const SPOTLIGHT_KEYS = [
  'headline',
  'image_url',
  'body',
  'bullets',
  'cta_label',
  'cta_url',
] as const

const LIMITS = { agenda: 24, spotlights: 8, rows: 40, text: 8000 }

export function agentPrompt(userText: string): string {
  return `You fill an Outlook email template. Reply with one JSON object and nothing else. No HTML, no markdown, no explanation.

master_type must be one of: newsletter, custom2, hackathon, event_invite, monthly_update, weekly_snapshot.
Text fields you may set: ${CAMPAIGN_KEYS.join(', ')}.
agenda is a list of {"text": "..."}.
spotlights is a list of {"headline","image_url","body","bullets","cta_label","cta_url"}.
rows is a list of {"section","title","title_url","col_a","col_b","col_c","col_d","col_e","col_f","col_g","highlight"}.
Weekly sections: new_requests, work_in_progress, completed.
Monthly sections: virtual_skilling, on_demand.
highlight is yellow, green, orange, or empty.
callouts and bullets are plain text with one item per line, never JSON arrays.
Omit anything you are not changing. Links inside text use [label](https://aka.ms/example).

User request:
${userText}`
}

export function extractJsonValue(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const source = fenced?.[1] ?? text
  const start = source.indexOf('{')
  const end = source.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(source.slice(start, end + 1)) as unknown
  } catch {
    return null
  }
}

export function parseAgentFill(input: unknown): AgentFill {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Copilot did not return field data.')
  }
  const record = input as Record<string, unknown>
  const nestedSource = record.fields ?? record.campaign
  const nested =
    nestedSource && typeof nestedSource === 'object' && !Array.isArray(nestedSource)
      ? (nestedSource as Record<string, unknown>)
      : {}

  const fields: Partial<Record<CampaignKey, string>> = {}
  for (const key of CAMPAIGN_KEYS) {
    const raw = record[key] !== undefined ? record[key] : nested[key]
    if (raw === undefined) continue
    fields[key] = cleanText(raw, key)
  }

  const masterRaw = record.master_type ?? nested.master_type
  const master_type = masterRaw === undefined ? undefined : cleanMaster(masterRaw)

  const agenda = readAgenda(record.agenda)
  const spotlights = readSpotlights(record.spotlights)
  const rows = readRows(record.rows ?? record.event_rows)

  const reply = typeof record.reply === 'string' ? record.reply.trim() : ''

  const fill: AgentFill = { fields }
  if (reply) fill.reply = reply
  if (master_type) fill.master_type = master_type
  if (agenda) fill.agenda = agenda
  if (spotlights) fill.spotlights = spotlights
  if (rows) fill.rows = rows

  const hasFields = Object.keys(fields).length > 0
  if (!reply && !hasFields && !master_type && !agenda && !spotlights && !rows) {
    throw new Error('Copilot did not return any fields to fill.')
  }
  return fill
}

function cleanMaster(value: unknown): MasterType {
  if (typeof value !== 'string') throw new Error('Template type must be text.')
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  const found = MASTER_ALIASES[key]
  if (!found) throw new Error('Copilot picked a template this studio does not have.')
  return found
}

// Fields that read as lists (callouts, bullets) are regularly returned as JSON
// arrays by the model. The templates render them as newline separated text, so
// fold an array into that shape instead of rejecting the whole fill over it.
const LIST_TEXT_FIELDS = new Set(['callouts'])

function textFromArray(value: unknown[], label: string): string {
  const lines = value
    .map((item) => {
      if (typeof item === 'string') return item
      if (typeof item === 'number' || typeof item === 'boolean') return String(item)
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const nested = record.text ?? record.label ?? record.title ?? record.value
        if (typeof nested === 'string') return nested
      }
      return ''
    })
    .map((line) => line.trim().replace(/^[-*\u2022]\s*/, ''))
    .filter(Boolean)
  // richHtml only renders a block as a list when every line starts with "- ".
  // Spotlight bullets are split on newlines and must not carry the marker.
  const prefix = LIST_TEXT_FIELDS.has(label) ? '- ' : ''
  return lines.map((line) => `${prefix}${line}`).join('\n')
}

function cleanText(value: unknown, label: string): string {
  let text: string
  if (typeof value === 'string') text = value
  else if (typeof value === 'number' || typeof value === 'boolean') text = String(value)
  else if (Array.isArray(value)) text = textFromArray(value, label)
  else throw new Error(`${label} must be text.`)

  if (text.includes('<') || text.includes('>')) {
    throw new Error(`${label} cannot include HTML. Copilot fills text only.`)
  }
  const trimmed = text.trim()
  if (trimmed.length > LIMITS.text) throw new Error(`${label} is too long.`)
  return trimmed
}

function readAgenda(value: unknown): AgendaFill[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new Error('agenda must be a list.')
  return value.slice(0, LIMITS.agenda).flatMap((item) => {
    if (typeof item === 'string') {
      const text = cleanText(item, 'agenda')
      return text ? [{ text }] : []
    }
    if (!item || typeof item !== 'object') return []
    const text = cleanText((item as Record<string, unknown>).text ?? '', 'agenda')
    return text ? [{ text }] : []
  })
}

function readSpotlights(value: unknown): SpotlightFill[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new Error('spotlights must be a list.')
  return value.slice(0, LIMITS.spotlights).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const card = emptySpotlight()
    for (const key of SPOTLIGHT_KEYS) {
      if (record[key] === undefined) continue
      card[key] = cleanText(record[key], key)
    }
    if (!card.headline && !card.body) return []
    return [card]
  })
}

function readRows(value: unknown): RowFill[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new Error('rows must be a list.')
  return value.slice(0, LIMITS.rows).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const row = emptyRow()
    for (const key of ROW_KEYS) {
      if (record[key] === undefined) continue
      row[key] = cleanText(record[key], key)
    }
    if (row.highlight && !['yellow', 'green', 'orange'].includes(row.highlight)) {
      row.highlight = ''
    }
    if (!row.title && !row.col_a && !row.col_d) return []
    return [row]
  })
}

function emptySpotlight(): SpotlightFill {
  return {
    headline: '',
    image_url: '',
    body: '',
    bullets: '',
    cta_label: '',
    cta_url: '',
  }
}

function emptyRow(): RowFill {
  return {
    section: '',
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
  }
}
