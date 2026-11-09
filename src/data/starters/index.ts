import type { CampaignBundle, MasterType } from '../../types'

/**
 * Ready-made designs you can start a campaign from. Each one loads only when
 * it is picked, so their pictures do not weigh down the studio.
 */
export const STARTERS: { id: string; master: MasterType; label: string; newName: string; hint?: string }[] = [
  { id: 'me7', master: 'newsletter', label: 'ME7 + Copilot learning paths', newName: 'New custom newsletter' },
  { id: 'custom2', master: 'custom2', label: 'Custom 2', newName: 'Untitled campaign' },
  {
    id: 'hackathon-register-today',
    master: 'hackathon',
    label: 'Register Today',
    newName: 'Register Today',
    hint: 'Invitation: event dates, prep workshops, courses, stages, and Register buttons',
  },
  {
    id: 'hackathon-registration',
    master: 'hackathon',
    label: 'Registration Confirmation',
    newName: 'Registration Confirmation',
    hint: 'Confirmed registration, portal login details, and next steps',
  },
  {
    id: 'hackathon-fy-summary',
    master: 'hackathon',
    label: 'FY Summary',
    newName: 'FY Summary',
    hint: 'Year-end report: overview, numbers, events, photos, highlights, people',
  },
  {
    id: 'hackathon-blank',
    master: 'hackathon',
    label: 'Blank hackathon email',
    newName: 'New hackathon email',
    hint: 'Same branding, with a greeting, a button, and support contact',
  },
]

export async function loadStarter(id: string): Promise<CampaignBundle> {
  if (id === 'me7') return (await import('./me7')).me7Starter()
  if (id === 'custom2') return (await import('./custom2')).custom2Starter()
  if (id === 'hackathon-registration') return (await import('./hackathon')).registrationConfirmationStarter()
  if (id === 'hackathon-blank') return (await import('./hackathon')).blankHackathonStarter()
  if (id === 'hackathon-register-today') return (await import('./registerToday')).registerTodayStarter()
  if (id === 'hackathon-fy-summary') return (await import('./hackathonFy')).fySummaryStarter()
  throw new Error('That template is not available.')
}
