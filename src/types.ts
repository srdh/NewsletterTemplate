import { t } from './lib/i18n'

export type MasterType =
  | 'newsletter'
  | 'custom2'
  | 'hackathon'
  | 'event_invite'
  | 'monthly_update'
  | 'weekly_snapshot'

export interface Campaign {
  id: string
  master_type: MasterType
  name: string
  subject: string
  region: string
  kicker: string
  title: string
  greeting: string
  intro: string
  event_name: string
  event_url: string
  event_date_label: string
  event_time_label: string
  language_note: string
  overview_body: string
  action_heading: string
  action_body: string
  register_label: string
  register_url: string
  secondary_cta_label: string
  secondary_cta_url: string
  signoff_thanks: string
  signer_name: string
  signer_title: string
  signer_email: string
  month_label: string
  subtitle: string
  contents_intro: string
  snapshot_date: string
  callouts: string
  /** Build What's Next banner art: an uploaded image (data URL), or empty for the globe. */
  banner_image: string
  /** Build What's Next optional wide image above the event overview (data URL). */
  section_image: string
  /**
   * Newsletter studio design (JSON): style, banner layout, body blocks with
   * rich text, and footer. Empty for the other masters. See lib/newsletter.ts.
   */
  newsletter?: string // also used by Custom 2 (custom2)
  /**
   * The language the email is written in: 'en' or 'fr' (see lib/emailText.ts).
   * Sets the email's fixed wording, its html lang, and the language Copilot
   * writes in. Empty or missing means English.
   */
  language?: string
  created_at: string
  updated_at: string
}

export interface AgendaItem {
  id: string
  campaign_id: string
  sort_order: number
  text: string
}

export interface SpotlightCard {
  id: string
  campaign_id: string
  sort_order: number
  headline: string
  image_url: string
  body: string
  bullets: string
  cta_label: string
  cta_url: string
}

export interface EventRow {
  id: string
  campaign_id: string
  sort_order: number
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

export interface CampaignBundle {
  campaign: Campaign
  agenda: AgendaItem[]
  spotlights: SpotlightCard[]
  rows: EventRow[]
}

export const MASTER_LABEL: Record<MasterType, string> = {
  get newsletter() {
    return t("Custom")
  },
  get custom2() {
    return t("Custom 2")
  },
  get hackathon() {
    return t("Hackathons")
  },
  get event_invite() {
    return t("Regional Template")
  },
  get monthly_update() {
    return t("Partner Skilling Update Template")
  },
  get weekly_snapshot() {
    return t("Weekly Project Snapshot")
  },
}

export const MASTER_HINT: Record<MasterType, string> = {
  get newsletter() {
    return t("Free-form newsletter in the ME7 + Copilot learning paths format")
  },
  get custom2() {
    return t("Block-by-block email: banner, text, event card, table, spotlights, call to action, signature")
  },
  get hackathon() {
    return t("Hackathon emails, block by block: registration confirmations and more")
  },
  get event_invite() {
    return t("Banner, Body, Section-1, Footer (MS Signature)")
  },
  get monthly_update() {
    return t("Newsletter with spotlight cards and skilling tables")
  },
  get weekly_snapshot() {
    return t("Ops status email with request and delivery tables")
  },
}

/** Email types edited with the newsletter engine (style, banner, blocks, footer). */
export function usesDesign(master: MasterType): boolean {
  return master === 'newsletter' || master === 'custom2' || master === 'hackathon'
}

/** Email types edited one block at a time (the block list). */
export function usesBlockList(master: MasterType): boolean {
  return master === 'custom2' || master === 'hackathon'
}
