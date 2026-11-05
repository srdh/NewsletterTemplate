import type { CampaignBundle, MasterType } from '../types'
import { renderEventInvite } from './eventInvite'
import { renderMonthlyUpdate } from './monthlyUpdate'
import { renderNewsletter } from './newsletter'
import { renderWeeklySnapshot } from './weeklySnapshot'

/** `preview` adds data-section markers so the preview can map clicks to fields. */
export function renderMaster(bundle: CampaignBundle, preview = false): string {
  const type: MasterType = bundle.campaign.master_type
  if (type === 'newsletter') return renderNewsletter(bundle, preview)
  if (type === 'monthly_update') return renderMonthlyUpdate(bundle, preview)
  if (type === 'weekly_snapshot') return renderWeeklySnapshot(bundle, preview)
  return renderEventInvite(bundle, preview)
}
