import type { CampaignBundle } from '../../types'
import { defaultDesign, writeDesign, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import { HACK_HERO, HACK_MS_LOGO, HACK_PARTNER_LOGO } from './hackathonImages'

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
export function keyDatesTable(): Extract<NewsletterDesign['blocks'][number], { kind: 'table' }> {
  return {
    id: id(),
    kind: 'table',
    title: 'Key dates',
    header: true,
    rows: [
      ['Phase', 'Date', 'What happens'],
      ['Registration', '[Date]', 'Confirmed: sign in to the Hackathon Portal'],
      ['Idea submission', '[Date]', 'Submit your Architecture Blueprint'],
      ['Idea review', '[Date]', 'Check the Status Review tab'],
      ['Build and demo', '[Date]', '[Details]'],
    ],
    headerBackground: NAVY,
    headerText: '#FFFFFF',
    border: '#D1D1D1',
    striped: true,
  }
}

const step = (text: string) => `<strong><span style="color:${NAVY}">${text}</span></strong>`
const term = (text: string) => `<strong><span style="color:${BLUE}">${text}</span></strong>`

function hackathonStyle(): NewsletterDesign {
  const base = defaultDesign()
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
      imageAlt: 'SoftwareOne Agentic AI Hackathon. Architect. Build. Innovate. Transform ideas into working AI-powered solutions.',
    },
    footer: {
      ...base.footer,
      background: '#F2F2F2',
      text: '#595959',
      html: '<p>This email is sent to you on behalf of Microsoft.</p>',
      links: [{ id: id(), label: 'Privacy Statement', url: PRIVACY }],
      showMark: false,
      logo: '',
      legal: `Microsoft Corporation\nOne Microsoft Way\nRedmond, WA 98052\n© ${new Date().getFullYear()} Microsoft Corporation. All rights reserved`,
    },
  }
}

export function registrationConfirmationStarter(): CampaignBundle {
  const design: NewsletterDesign = {
    ...hackathonStyle(),
    blocks: [
      {
        id: id(),
        kind: 'text',
        html:
          '<p><strong>Hello [First name],</strong></p>' +
          '<p>Thank you for registering for the <strong>SoftwareOne Agentic AI Hackathon</strong>.</p>',
      },
      keyDatesTable(),
      {
        id: id(),
        kind: 'callout',
        html: '<p style="text-align:center"><strong>Your registration has been confirmed ✅</strong></p>',
        background: '#EAF4FB',
        showRule: false,
        rule: '',
        text: NAVY,
        border: '#C7E0F4',
      },
      { id: id(), kind: 'heading', title: 'Hackathon Portal – Getting Started', color: '', rule: BLUE, size: 18 },
      {
        id: id(),
        kind: 'text',
        html:
          `<p>${step('1. Login to the Hackathon Portal')} - <strong><a href="${PORTAL_URL}">SoftwareOne Agentic AI Hackathon</a></strong><br>` +
          'Access the portal using the above link and sign in with your registered email ID.</p>',
      },
      {
        id: id(),
        kind: 'details',
        title: 'Your Login Credentials:',
        rows: [
          { id: id(), label: 'Email', value: '[Participant email]', note: '', strong: true },
          { id: id(), label: 'Password', value: '[Temporary password]', note: '(Temporary password)', strong: true },
          { id: id(), label: 'Team Name', value: '[Team name]', note: '', strong: false },
          { id: id(), label: 'Role', value: '[Role, e.g. Team Leader]', note: '', strong: false },
        ],
        labelColor: '#77206D',
        accent: '',
        background: '#FFFFFF',
      },
      {
        id: id(),
        kind: 'text',
        html:
          `<p>${step('2. Review your Team Roster and proceed with Idea Submission')}</p>` +
          '<ul>' +
          `<li>Select ${term('Go to Dashboard')} on the Landing page</li>` +
          `<li>Browse to ${term('Hack Journey')} on the left and review the ${term('Team Roster')}</li>` +
          '<li>Connect with your team and proceed with Ideation</li>' +
          `<li>Select the ${term('Blueprint')} tab to submit your ${term('Architecture Blueprint')}</li>` +
          '</ul>' +
          `<p>${step('3. Idea Review')} – Check the <strong>Status Review</strong> Tab, for the status on Idea evaluation by judges.</p>`,
      },
      { id: id(), kind: 'divider' },
      {
        id: id(),
        kind: 'text',
        html: `<p>If you have any questions in the meantime, please feel free to reach out to:<br><strong><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></strong>.</p>`,
      },
    ],
  }

  const campaign = emptyCampaign('hackathon')
  return {
    campaign: {
      ...campaign,
      name: 'Registration Confirmation',
      subject: '[SoftwareOne] APAC Hack to Build – Agentic AI Hackathon | Registration Confirmation',
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
export function blankHackathonStarter(): CampaignBundle {
  const design: NewsletterDesign = {
    ...hackathonStyle(),
    blocks: [
      { id: id(), kind: 'text', html: '<p><strong>Hello [First name],</strong></p><p>Write your message here.</p>' },
      { id: id(), kind: 'button', label: 'Go to the Hackathon Portal', url: PORTAL_URL, align: 'left', color: '' },
      { id: id(), kind: 'divider' },
      {
        id: id(),
        kind: 'text',
        html: `<p>If you have any questions, please reach out to:<br><strong><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></strong>.</p>`,
      },
    ],
  }
  const campaign = emptyCampaign('hackathon')
  return {
    campaign: {
      ...campaign,
      name: 'New hackathon email',
      subject: '[SoftwareOne] APAC Hack to Build – Agentic AI Hackathon | ',
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
