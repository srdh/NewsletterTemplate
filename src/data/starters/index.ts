import type { CampaignBundle, MasterType } from '../../types'

/**
 * Ready-made designs you can start a campaign from. Each one loads only when
 * it is picked, so their pictures do not weigh down the studio.
 */
export const STARTERS: { id: string; master: MasterType; label: string }[] = [
  { id: 'me7', master: 'newsletter', label: 'ME7 + Copilot learning paths' },
]

export async function loadStarter(id: string): Promise<CampaignBundle> {
  if (id === 'me7') return (await import('./me7')).me7Starter()
  throw new Error('That template is not available.')
}
