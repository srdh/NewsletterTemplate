import type { CampaignBundle, MasterType } from '../../types'
import { t, type Lang } from '../../lib/i18n'

/**
 * Ready-made designs you can start a campaign from. Each one loads only when
 * it is picked, so their pictures do not weigh down the studio.
 */
export const STARTERS: { id: string; master: MasterType; label: string; newName: string; hint?: string }[] = [
  { id: 'me7', master: 'newsletter', get label() {
    return t("ME7 + Copilot learning paths")
  }, newName: 'New custom newsletter' },
  { id: 'custom2', master: 'custom2', get label() {
    return t("Custom 2")
  }, newName: 'Untitled campaign' },
  {
    id: 'hackathon-register-today',
    master: 'hackathon',
    get label() {
    return t("Register Today")
  },
    newName: 'Register Today',
    get hint() {
    return t("Invitation: event dates, prep workshops, courses, stages, and Register buttons")
  },
  },
  {
    id: 'hackathon-registration',
    master: 'hackathon',
    get label() {
    return t("Registration Confirmation")
  },
    newName: 'Registration Confirmation',
    get hint() {
    return t("Confirmed registration, portal login details, and next steps")
  },
  },
  {
    id: 'hackathon-fy-summary',
    master: 'hackathon',
    get label() {
    return t("FY Summary")
  },
    newName: 'FY Summary',
    get hint() {
    return t("Year-end report: overview, numbers, events, photos, highlights, people")
  },
  },
  {
    id: 'hackathon-blank',
    master: 'hackathon',
    get label() {
    return t("Blank hackathon email")
  },
    newName: 'New hackathon email',
    get hint() {
    return t("Same branding, with a greeting, a button, and support contact")
  },
  },
]

/** Builds a starter's email, with its text in the given language. */
export async function loadStarter(id: string, lang: Lang = 'en'): Promise<CampaignBundle> {
  const bundle = await buildStarter(id, lang)
  bundle.campaign.language = lang
  return bundle
}

/** A starter's name for a new email, in that email's language. */
export async function starterName(id: string, lang: Lang): Promise<string | undefined> {
  const english = STARTERS.find((starter) => starter.id === id)?.newName
  if (!english) return undefined
  return (await import('./lang')).starterT(lang)(english)
}

async function buildStarter(id: string, lang: Lang): Promise<CampaignBundle> {
  if (id === 'me7') return (await import('./me7')).me7Starter(lang)
  if (id === 'custom2') return (await import('./custom2')).custom2Starter(lang)
  if (id === 'hackathon-registration') return (await import('./hackathon')).registrationConfirmationStarter(lang)
  if (id === 'hackathon-blank') return (await import('./hackathon')).blankHackathonStarter(lang)
  if (id === 'hackathon-register-today') return (await import('./registerToday')).registerTodayStarter(lang)
  if (id === 'hackathon-fy-summary') return (await import('./hackathonFy')).fySummaryStarter(lang)
  throw new Error(t("That template is not available."))
}
