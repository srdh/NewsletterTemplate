import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { emptyCampaign, newsletterSeed, seedBundles } from '../data/seed'
import { STARTERS, loadStarter } from '../data/starters'
import { bundleFromTemplate, type UserTemplate } from '../data/userTemplates'
import type {
  AgendaItem,
  Campaign,
  CampaignBundle,
  EventRow,
  MasterType,
  SpotlightCard,
} from '../types'

const STORAGE_KEY = 'oft-template-maker/v1'
/** Set once the Newsletter studio example has been added to older local data. */
const NEWSLETTER_SEEDED_KEY = 'oft-template-maker/newsletter-seeded'
/** Set once the ME7 learning path newsletter has been added to the list. */
const ME7_SEEDED_KEY = 'oft-template-maker/me7-seeded'
const ME7_EXAMPLE_ID = '0f6c2d1a-6a0a-4d2e-9c2b-0000000000e5'
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

export const storageMode: 'supabase' | 'local' = supabase ? 'supabase' : 'local'

type Tables = {
  campaigns: Campaign[]
  agenda_items: AgendaItem[]
  spotlight_cards: SpotlightCard[]
  event_rows: EventRow[]
}

function emptyTables(): Tables {
  return {
    campaigns: [],
    agenda_items: [],
    spotlight_cards: [],
    event_rows: [],
  }
}

function readLocal(): Tables {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyTables()
  try {
    return { ...emptyTables(), ...JSON.parse(raw) }
  } catch {
    return emptyTables()
  }
}

function writeLocal(tables: Tables) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tables))
}

function rankMaster(type: string): number {
  if (type === 'event_invite') return 0
  if (type === 'monthly_update') return 1
  if (type === 'weekly_snapshot') return 2
  if (type === 'newsletter') return 3
  if (type === 'custom2') return 4
  if (type === 'hackathon') return 5
  return 9
}

function sortCampaigns(list: Campaign[]): Campaign[] {
  return [...list].sort((a, b) => rankMaster(a.master_type) - rankMaster(b.master_type))
}

function bundleFrom(tables: Tables, campaign: Campaign): CampaignBundle {
  const id = campaign.id
  return {
    campaign,
    agenda: tables.agenda_items
      .filter((row) => row.campaign_id === id)
      .sort((a, b) => a.sort_order - b.sort_order),
    spotlights: tables.spotlight_cards
      .filter((row) => row.campaign_id === id)
      .sort((a, b) => a.sort_order - b.sort_order),
    rows: tables.event_rows
      .filter((row) => row.campaign_id === id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }
}

function applySeed(tables: Tables): Tables {
  if (tables.campaigns.length) return addNewsletterExample(tables)
  const next = emptyTables()
  for (const bundle of seedBundles()) {
    next.campaigns.push(bundle.campaign)
    next.agenda_items.push(...bundle.agenda)
    next.spotlight_cards.push(...bundle.spotlights)
    next.event_rows.push(...bundle.rows)
  }
  return next
}

/**
 * Browsers that already had the three original samples get the Newsletter
 * studio example once. Deleting it later does not bring it back.
 */
function addNewsletterExample(tables: Tables): Tables {
  try {
    if (localStorage.getItem(NEWSLETTER_SEEDED_KEY)) return tables
    localStorage.setItem(NEWSLETTER_SEEDED_KEY, '1')
  } catch {
    return tables
  }
  if (tables.campaigns.some((row) => row.master_type === 'newsletter')) return tables
  const example = newsletterSeed()
  return { ...tables, campaigns: [example.campaign, ...tables.campaigns] }
}

/**
 * Ready-made examples added to this browser's list once each: the ME7
 * learning path newsletter and the Hackathons Registration Confirmation.
 * Deleting one later does not bring it back.
 */
const EXAMPLES: { starter: string; key: string; id: string }[] = [
  { starter: 'me7', key: ME7_SEEDED_KEY, id: ME7_EXAMPLE_ID },
  {
    starter: 'hackathon-registration',
    key: 'oft-template-maker/hackathon-registration-seeded',
    id: '0f6c2d1a-6a0a-4d2e-9c2b-0000000000f6',
  },
]

async function addStarterExample(tables: Tables): Promise<Tables> {
  let result = tables
  for (const example of EXAMPLES) {
    try {
      if (localStorage.getItem(example.key)) continue
    } catch {
      return result
    }
    let bundle: CampaignBundle
    try {
      bundle = await loadStarter(example.starter)
    } catch {
      continue
    }
    // Re-read after the wait: another load of the list may have saved since.
    const latest = readLocal()
    const base = latest.campaigns.length >= result.campaigns.length ? latest : result
    try {
      localStorage.setItem(example.key, '1')
    } catch {
      // Without storage the example simply shows again next time.
    }
    result = base.campaigns.some((row) => row.id === example.id)
      ? base
      : { ...base, campaigns: [{ ...bundle.campaign, id: example.id }, ...base.campaigns] }
    writeLocal(result)
  }
  return result
}

export async function listCampaigns(): Promise<Campaign[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    if (!data?.length) {
      await seedCloud()
      const retry = await supabase
        .from('campaigns')
        .select('*')
        .order('updated_at', { ascending: false })
      if (retry.error) throw retry.error
      return sortCampaigns(retry.data ?? [])
    }
    return sortCampaigns(data)
  }
  const tables = await addStarterExample(applySeed(readLocal()))
  writeLocal(tables)
  return sortCampaigns(tables.campaigns)
}

export async function getBundle(id: string): Promise<CampaignBundle | null> {
  if (supabase) {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    const [agenda, spotlights, rows] = await Promise.all([
      supabase.from('agenda_items').select('*').eq('campaign_id', id).order('sort_order'),
      supabase.from('spotlight_cards').select('*').eq('campaign_id', id).order('sort_order'),
      supabase.from('event_rows').select('*').eq('campaign_id', id).order('sort_order'),
    ])
    if (agenda.error) throw agenda.error
    if (spotlights.error) throw spotlights.error
    if (rows.error) throw rows.error
    return {
      campaign,
      agenda: agenda.data ?? [],
      spotlights: spotlights.data ?? [],
      rows: rows.data ?? [],
    }
  }
  const tables = applySeed(readLocal())
  const campaign = tables.campaigns.find((row) => row.id === id)
  return campaign ? bundleFrom(tables, campaign) : null
}

export async function saveBundle(bundle: CampaignBundle): Promise<void> {
  const campaign = { ...bundle.campaign, updated_at: new Date().toISOString() }
  const agenda = bundle.agenda.map((row, index) => ({ ...row, sort_order: index }))
  const spotlights = bundle.spotlights.map((row, index) => ({ ...row, sort_order: index }))
  const rows = bundle.rows.map((row, index) => ({ ...row, sort_order: index }))

  if (supabase) {
    const { error: campaignError } = await supabase.from('campaigns').upsert(campaign)
    if (campaignError) throw campaignError
    await replaceChildren('agenda_items', campaign.id, agenda)
    await replaceChildren('spotlight_cards', campaign.id, spotlights)
    await replaceChildren('event_rows', campaign.id, rows)
    return
  }

  const tables = applySeed(readLocal())
  tables.campaigns = [
    campaign,
    ...tables.campaigns.filter((row) => row.id !== campaign.id),
  ]
  tables.agenda_items = [
    ...tables.agenda_items.filter((row) => row.campaign_id !== campaign.id),
    ...agenda,
  ]
  tables.spotlight_cards = [
    ...tables.spotlight_cards.filter((row) => row.campaign_id !== campaign.id),
    ...spotlights,
  ]
  tables.event_rows = [
    ...tables.event_rows.filter((row) => row.campaign_id !== campaign.id),
    ...rows,
  ]
  writeLocal(tables)
}

async function replaceChildren(
  table: 'agenda_items' | 'spotlight_cards' | 'event_rows',
  campaignId: string,
  rows: object[],
) {
  if (!supabase) return
  const { error: delError } = await supabase.from(table).delete().eq('campaign_id', campaignId)
  if (delError) throw delError
  if (!rows.length) return
  const { error } = await supabase.from(table).insert(rows)
  if (error) throw error
}

export async function createCampaign(master: MasterType): Promise<CampaignBundle> {
  const campaign = emptyCampaign(master)
  const bundle: CampaignBundle = {
    campaign,
    agenda: [],
    spotlights: [],
    rows: [],
  }
  await saveBundle(bundle)
  return bundle
}

/** A new campaign from a ready-made template (see data/starters). */
export async function createFromStarter(starterId: string): Promise<CampaignBundle> {
  const bundle = await loadStarter(starterId)
  bundle.campaign.name = STARTERS.find((starter) => starter.id === starterId)?.newName ?? bundle.campaign.name
  await saveBundle(bundle)
  return bundle
}

/** A new campaign from a template you saved ("Save as template"). */
export async function createFromUserTemplate(template: UserTemplate): Promise<CampaignBundle> {
  const bundle = bundleFromTemplate(template)
  await saveBundle(bundle)
  return bundle
}

/** A full copy of a campaign, its rows and images, saved under a new name. */
export async function duplicateCampaign(source: CampaignBundle): Promise<CampaignBundle> {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const bundle: CampaignBundle = {
    campaign: {
      ...source.campaign,
      id,
      name: `${source.campaign.name} (copy)`,
      created_at: now,
      updated_at: now,
    },
    agenda: source.agenda.map((row) => ({ ...row, id: crypto.randomUUID(), campaign_id: id })),
    spotlights: source.spotlights.map((row) => ({ ...row, id: crypto.randomUUID(), campaign_id: id })),
    rows: source.rows.map((row) => ({ ...row, id: crypto.randomUUID(), campaign_id: id })),
  }
  await saveBundle(bundle)
  return bundle
}

export async function deleteCampaign(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('campaigns').delete().eq('id', id)
    if (error) throw error
    return
  }
  const tables = readLocal()
  tables.campaigns = tables.campaigns.filter((row) => row.id !== id)
  tables.agenda_items = tables.agenda_items.filter((row) => row.campaign_id !== id)
  tables.spotlight_cards = tables.spotlight_cards.filter((row) => row.campaign_id !== id)
  tables.event_rows = tables.event_rows.filter((row) => row.campaign_id !== id)
  writeLocal(tables)
}

async function seedCloud() {
  if (!supabase) return
  for (const bundle of seedBundles()) {
    await saveBundle(bundle)
  }
}
