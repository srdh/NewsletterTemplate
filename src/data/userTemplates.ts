import type { Campaign, CampaignBundle, MasterType } from '../types'

/*
 * "Save as template": emails you saved to start new ones from. They live in
 * this browser (localStorage), like the campaigns when Supabase is not set up.
 */

export interface UserTemplate {
  id: string
  name: string
  master_type: MasterType
  saved_at: string
  /** The email's fields, without its id or dates. */
  campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
}

const KEY = 'oft-template-maker/user-templates'

export function listUserTemplates(): UserTemplate[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((item) => item && item.id && item.campaign) : []
  } catch {
    return []
  }
}

function write(list: UserTemplate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    throw new Error('Could not save the template: this browser’s storage is full. Remove large images or old templates and try again.')
  }
}

export function saveUserTemplate(bundle: CampaignBundle, name: string): UserTemplate {
  const { id: _id, created_at: _created, updated_at: _updated, ...fields } = bundle.campaign
  void _id
  void _created
  void _updated
  const template: UserTemplate = {
    id: crypto.randomUUID(),
    name: name.trim() || bundle.campaign.name || 'My template',
    master_type: bundle.campaign.master_type,
    saved_at: new Date().toISOString(),
    campaign: fields,
  }
  write([template, ...listUserTemplates()])
  return template
}

export function deleteUserTemplate(id: string): UserTemplate[] {
  const next = listUserTemplates().filter((item) => item.id !== id)
  write(next)
  return next
}

/** A new campaign from a saved template. */
export function bundleFromTemplate(template: UserTemplate): CampaignBundle {
  const stamp = new Date().toISOString()
  return {
    campaign: {
      ...template.campaign,
      id: crypto.randomUUID(),
      name: template.name,
      created_at: stamp,
      updated_at: stamp,
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}
