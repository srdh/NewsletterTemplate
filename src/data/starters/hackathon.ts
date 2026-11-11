import type { CampaignBundle } from '../../types'
import { defaultDesign, writeDesign, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import { HACK_HERO, HACK_MS_LOGO, HACK_PARTNER_LOGO } from './hackathonImages'
import type { Lang } from '../../lib/i18n'
import { starterT, type StarterT } from './lang'

/** Starter text in the new email's language, set when a starter is built. */
let T: StarterT = starterT('en')

/*
 * Hackathons campaigns, edited block by block like Custom 2.
 *
 * "Registration Confirmation" is rebuilt from the SoftwareOne Agentic AI
 * Hackathon confirmation email. The participant's details (name, email,
 * password, team, role) are placeholders: fill them per recipient, or use the
 * email as a mail-merge template. Never paste real passwords into a shared
 * template.
 */

function id(): string {
  return crypto.randomUUID()
}

const NAVY = '#003B70'
const BLUE = '#0078D4'
const PORTAL_URL =
  'https://aicoe.microsoftpartnerhackathons.com/login?tenant_slug=aicoe&redirect=/event/c8b9e3e5-b43c-4772-b19c-48cf27fac92d'
const SUPPORT_EMAIL = 'platform-support@vectorsenseus.com'
const PRIVACY = 'https://www.microsoft.com/en-us/privacy/privacystatement'

/** The Key dates table under the greeting (also added to existing copies, see repo.ts). */
export function keyDatesTable(lang: Lang = 'en'): Extract<NewsletterDesign['blocks'][number], { kind: 'table' }> {
  const T = starterT(lang)
  return {
    id: id(),
    kind: 'table',
    title: T('Key dates'),
    header: true,
    rows: [
      [T('Phase'), T('Date'), T('What happens')],
      [T('Registration'), T('[Date]'), T('Confirmed: sign in to the Hackathon Portal')],
      [T('Idea submission'), T('[Date]'), T('Submit your Architecture Blueprint')],
      [T('Idea review'), T('[Date]'), T('Check the Status Review tab')],
      [T('Build and demo'), T('[Date]'), T('[Details]')],
    ],
    headerBackground: NAVY,
    headerText: '#FFFFFF',
    border: '#D1D1D1',
    striped: true,
  }
}

const step = (text: string) => `<strong><span style="color:${NAVY}">${text}</span></strong>`
const term = (text: string) => `<strong><span style="color:${BLUE}">${text}</span></strong>`

function hackathonStyle(lang: Lang): NewsletterDesign {
  const base = defaultDesign(lang)
  return {
    ...base,
    style: { ...base.style, accent: NAVY, link: BLUE, paper: '#FFFFFF', canvas: '#FFFFFF', font: 'Segoe UI', size: 14, frame: '#E4E4E4', width: 640 },
    banner: {
      ...base.banner,
      layout: 'image',
      align: 'left',
      background: NAVY,
      text: '#FFFFFF',
      showMark: true,
      logo: HACK_MS_LOGO,
      rightLogo: HACK_PARTNER_LOGO,
      dateLabel: '',
      imageAlt: T('SoftwareOne Agentic AI Hackathon. Architect. Build. Innovate. Transform ideas into working AI-powered solutions.'),
    },
    footer: {
      ...base.footer,
      background: '#F2F2F2',
      text: '#595959',
      html: T('<p>This email is sent to you on behalf of Microsoft.</p>'),
      links: [{ id: id(), label: T('Privacy Statement'), url: PRIVACY }],
      showMark: false,
      logo: '',
      legal: T('Microsoft Corporation\nOne Microsoft Way\nRedmond, WA 98052\n© {year} Microsoft Corporation. All rights reserved', { year: new Date().getFullYear() }),
    },
  }
}

export function registrationConfirmationStarter(lang: Lang = 'en'): CampaignBundle {
  T = starterT(lang)
  const design: NewsletterDesign = {
    ...hackathonStyle(lang),
    blocks: [
      {
        id: id(),
        kind: 'text',
        html:
          T('<p><strong>Hello [First name],</strong></p>') +
          T('<p>Thank you for registering for the <strong>SoftwareOne Agentic AI Hackathon</strong>.</p>'),
      },
      keyDatesTable(lang),
      {
        id: id(),
        kind: 'callout',
        html: T('<p style="text-align:center"><strong>Your registration has been confirmed ✅</strong></p>'),
        background: '#EAF4FB',
        showRule: false,
        rule: '',
        text: NAVY,
        border: '#C7E0F4',
      },
      { id: id(), kind: 'heading', title: T('Hackathon Portal – Getting Started'), color: '', rule: BLUE, size: 18 },
      {
        id: id(),
        kind: 'text',
        html:
          T('<p>{step} - <strong><a href="{portal}">SoftwareOne Agentic AI Hackathon</a></strong><br>Access the portal using the above link and sign in with your registered email ID.</p>', {
            step: step(T('1. Login to the Hackathon Portal')),
            portal: PORTAL_URL,
          }),
      },
      {
        id: id(),
        kind: 'details',
        title: T('Your Login Credentials:'),
        rows: [
          { id: id(), label: T('Email'), value: T('[Participant email]'), note: '', strong: true },
          { id: id(), label: T('Password'), value: T('[Temporary password]'), note: T('(Temporary password)'), strong: true },
          { id: id(), label: T('Team Name'), value: T('[Team name]'), note: '', strong: false },
          { id: id(), label: T('Role'), value: T('[Role, e.g. Team Leader]'), note: '', strong: false },
        ],
        labelColor: '#77206D',
        accent: '',
        background: '#FFFFFF',
      },
      {
        id: id(),
        kind: 'text',
        html:
          `<p>${step(T('2. Review your Team Roster and proceed with Idea Submission'))}</p>` +
          T('<ul>') +
          T('<li>Select {a} on the Landing page</li>', { a: term(T('Go to Dashboard')) }) +
          T('<li>Browse to {a} on the left and review the {b}</li>', { a: term(T('Hack Journey')), b: term(T('Team Roster')) }) +
          T('<li>Connect with your team and proceed with Ideation</li>') +
          T('<li>Select the {a} tab to submit your {b}</li>', { a: term(T('Blueprint')), b: term(T('Architecture Blueprint')) }) +
          T('</ul>') +
          T('<p>{step} – Check the <strong>Status Review</strong> Tab, for the status on Idea evaluation by judges.</p>', { step: step(T('3. Idea Review')) }),
      },
      { id: id(), kind: 'divider' },
      {
        id: id(),
        kind: 'text',
        html: T('<p>If you have any questions in the meantime, please feel free to reach out to:<br><strong><a href="mailto:{email}">{email}</a></strong>.</p>', { email: SUPPORT_EMAIL }),
      },
    ],
  }

  const campaign = emptyCampaign('hackathon', lang)
  return {
    campaign: {
      ...campaign,
      name: T('Registration Confirmation'),
      subject: T('[SoftwareOne] APAC Hack to Build – Agentic AI Hackathon | Registration Confirmation'),
      kicker: '',
      title: '',
      subtitle: '',
      register_label: '',
      register_url: '',
      banner_image: HACK_HERO,
      newsletter: writeDesign(design),
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}

/** A blank hackathon email in the same style, for other hackathon campaigns. */
export function blankHackathonStarter(lang: Lang = 'en'): CampaignBundle {
  T = starterT(lang)
  const design: NewsletterDesign = {
    ...hackathonStyle(lang),
    blocks: [
      { id: id(), kind: 'text', html: T('<p><strong>Hello [First name],</strong></p><p>Write your message here.</p>') },
      { id: id(), kind: 'button', label: T('Go to the Hackathon Portal'), url: PORTAL_URL, align: 'left', color: '' },
      { id: id(), kind: 'divider' },
      {
        id: id(),
        kind: 'text',
        html: T('<p>If you have any questions, please reach out to:<br><strong><a href="mailto:{email}">{email}</a></strong>.</p>', { email: SUPPORT_EMAIL }),
      },
    ],
  }
  const campaign = emptyCampaign('hackathon', lang)
  return {
    campaign: {
      ...campaign,
      name: T('New hackathon email'),
      subject: T('[SoftwareOne] APAC Hack to Build – Agentic AI Hackathon | '),
      kicker: '',
      title: '',
      subtitle: '',
      banner_image: HACK_HERO,
      newsletter: writeDesign(design),
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}
