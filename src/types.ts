export type MasterType =
  | 'newsletter'
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
  newsletter?: string
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
  newsletter: 'Newsletter studio',
  event_invite: 'Regional event invite',
  monthly_update: 'Partner Skilling Update',
  weekly_snapshot: 'Weekly project snapshot',
}

export const MASTER_HINT: Record<MasterType, string> = {
  newsletter: 'Your own banner, rich text body blocks, and footer',
  event_invite: 'Banner, Body, Section-1, Footer (MS Signature)',
  monthly_update: 'Newsletter with spotlight cards and skilling tables',
  weekly_snapshot: 'Ops status email with request and delivery tables',
}
