import type { CampaignBundle, MasterType } from '../../types'

/**
 * Ready-made designs you can start a campaign from. Each one loads only when
 * it is picked, so their pictures do not weigh down the studio.
 */
export const STARTERS: { id: string; master: MasterType; label: string; newName: string }[] = [
  { id: 'me7', master: 'newsletter', label: 'ME7 + Copilot learning paths', newName: 'New custom newsletter' },
  { id: 'custom2', master: 'custom2', label: 'Custom 2', newName: 'Untitled campaign' },
]

export async function loadStarter(id: string): Promise<CampaignBundle> {
  if (id === 'me7') return (await import('./me7')).me7Starter()
  if (id === 'custom2') return (await import('./custom2')).custom2Starter()
  throw new Error('That template is not available.')
}
