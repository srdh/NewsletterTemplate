import type { CampaignBundle } from '../../types'
import { PRIVACY_URL, defaultDesign, writeDesign, type BodyBlock, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import { FY_MS_LOGO } from './hackathonFyImages'
import { RT_BANNER_ART, RT_MS_LOGO_WHITE, RT_PARTNER_LOGO } from './registerTodayImages'

/*
 * Hackathons "Register Today": an invitation to a partner hackathon,
 * generalized from the "Microsoft Insight Forge Hackathon" invitation.
 *
 * Kept: the layout (logo strip, banner, white intro, workshops band,
 * hackathon band, dark footer), the section wording, and the hackathon
 * stage names. Colours are from the Microsoft palette. Anything specific to one event (partner, name, themes, dates,
 * workshops, courses, links, prizes) is a [placeholder].
 */

function id(): string {
  return crypto.randomUUID()
}

// Microsoft colour palette.
const DARK_TEAL = '#225B62'
const TEAL = '#49C5B1'
const LIGHT_TEAL = '#B9DCD2'
const WARM_WHITE = '#FFF8F3'
const BLACK = '#000000'
const REGISTER_URL = 'https://[registration-link]'

const heading = (title: string, shade?: string): BodyBlock => ({ id: id(), kind: 'heading', title, color: DARK_TEAL, rule: '', size: 20, fill: '', outline: '', shade })
const text = (html: string, shade?: string): BodyBlock => ({ id: id(), kind: 'text', html, shade })
const register = (shade?: string): BodyBlock => ({ id: id(), kind: 'button', label: 'Register now', url: REGISTER_URL, align: 'left', color: DARK_TEAL, shade })
const table = (rows: string[][], shade: string): BodyBlock => ({
  id: id(),
  kind: 'table',
  title: '',
  header: true,
  rows,
  headerBackground: '#FFFFFF',
  headerText: BLACK,
  border: '#D1D1D1',
  striped: false,
  plain: true,
  shade,
})

export function registerTodayStarter(): CampaignBundle {
  const base = defaultDesign()
  const design: NewsletterDesign = {
    ...base,
    style: {
      ...base.style,
      accent: DARK_TEAL,
      link: DARK_TEAL,
      paper: '#FFFFFF',
      canvas: WARM_WHITE,
      font: 'Segoe UI',
      size: 14,
      frame: LIGHT_TEAL,
      width: 640,
    },
    banner: {
      ...base.banner,
      layout: 'split',
      align: 'left',
      background: DARK_TEAL,
      text: '#FFFFFF',
      showMark: true,
      logo: FY_MS_LOGO,
      rightLogo: RT_PARTNER_LOGO,
      dateLabel: '',
      imageAlt: '',
      logoBar: true,
    },
    blocks: [
      heading('Join us for the Microsoft [Partner] Global Hackathon!'),
      text(
        '<p>We’re excited to invite you to explore the upcoming <strong>Microsoft [Partner] Global Hackathon</strong> event. These immersive experiences are designed to spark innovation, giving you the chance to build, experiment, and create impactful solutions. Hackathon themes cover <strong>[themes, e.g. Building AI Agents using Microsoft AI Foundry &amp; Fabric solutions]</strong>. Take part in this transformative experience and empower yourself to drive innovation with AI.</p>',
      ),
      {
        id: id(),
        kind: 'callout',
        html: `<p style="text-align:center"><span style="font-size:20px;color:${DARK_TEAL}">[Start date] – [End date], [Year]</span><br>[Start time] [Time zone]</p>`,
        background: '#FFFFFF',
        showRule: false,
        rule: '',
        text: '',
        border: TEAL,
      },
      text(
        '<p>Bring your best ideas to the challenge—<strong>our top teams will earn [prizes, e.g. major prizes, including an exclusive celebration experience with standout gifts]</strong>. This is your chance to innovate, compete, and shine on a global stage.</p>',
      ),
      register(),

      heading('Gain technical expertise from Hack Prep Workshops', LIGHT_TEAL),
      text(
        '<p>Delivered by Microsoft Subject Matter Experts (SMEs), these preparatory sessions empower attendees to showcase the potential of each technology and demonstrate how it can be applied to build real-world solutions.</p>',
        LIGHT_TEAL,
      ),
      table(
        [
          ['Date', 'Live Workshops'],
          ['[DD-Mon-YYYY]', '[Workshop topic]'],
          ['[DD-Mon-YYYY]', '[Workshop topic]'],
          ['[DD-Mon-YYYY]', '[Workshop topic]'],
        ],
        LIGHT_TEAL,
      ),
      text(
        '<p>Attendees can <strong>also leverage self-paced courses</strong> to develop comprehensive expertise, enabling them to master advanced concepts at their own pace and reinforce hands-on learning from the workshops.</p>',
        LIGHT_TEAL,
      ),
      table(
        [
          ['Format', 'Self-Paced Course Titles'],
          ['Self-Paced', '[Course title](https://course-link)'],
          ['Self-Paced', '[Course title](https://course-link)'],
          ['Self-Paced', '[Course title](https://course-link)'],
        ],
        LIGHT_TEAL,
      ),

      heading('Bring your ideas to life at the Hackathon!', WARM_WHITE),
      text(
        '<p>You’ll work in a dynamic, team-based environment—gaining not only technical experience but also valuable mentorship and guidance from dedicated Microsoft subject matter experts. It’s a great opportunity to learn, create, and make a real impact.</p>',
        WARM_WHITE,
      ),
      table(
        [
          ['Date', 'Stages'],
          ['[DD-Mon-YYYY]', 'Hackathon – Ideation & Submission'],
          ['[DD-Mon-YYYY]', 'Hackathon – Build & Submission'],
          ['[DD-Mon-YYYY]', 'Hackathon – Evaluation'],
          ['[DD-Mon-YYYY]', 'Hackathon Conclusion & Recognition'],
        ],
        WARM_WHITE,
      ),
      text(
        '<p>Participants will gain practical experience in [what they will learn, e.g. orchestrating AI agents and integrating advanced capabilities into real-world applications].</p>',
        WARM_WHITE,
      ),
      text(
        '<p><strong>Looking to complete your year-end CRT requirements?</strong><br>This hackathon is the perfect springboard. The live workshops and self-paced courses included in the program map directly to the foundational learning behind several key certifications. While exams are still required, you’ll walk away with the knowledge, practice, and confidence to fast-track your CRT requirements and finish the year strong.</p>',
        WARM_WHITE,
      ),
      register(WARM_WHITE),
    ],
    footer: {
      ...base.footer,
      background: DARK_TEAL,
      text: '#FFFFFF',
      html: `<p><span style="font-size:11px">Let me know if you’d prefer I not forward you these communications. To learn how to manage your contact preferences for other parts of Microsoft, please read our <a href="${PRIVACY_URL}">Privacy Statement</a>.</span></p>`,
      links: [],
      showMark: true,
      logo: RT_MS_LOGO_WHITE,
      legal: 'Microsoft Corporation\nOne Microsoft Way\nRedmond, WA 98052 USA\n© [Year] Microsoft Corporation. All rights reserved.',
    },
  }

  const campaign = emptyCampaign('hackathon')
  return {
    campaign: {
      ...campaign,
      name: 'Register Today',
      subject: 'Invitation for the [Partner] Microsoft [Event name] Hackathon event | [Start date] - [End date], [Year]',
      kicker: '',
      title: 'Microsoft [Event name] Hackathon',
      subtitle: '',
      register_label: '',
      register_url: '',
      banner_image: RT_BANNER_ART,
      newsletter: writeDesign(design),
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}
