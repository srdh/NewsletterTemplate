import type { CampaignBundle } from '../../types'
import { PRIVACY_URL, defaultDesign, writeDesign, type BodyBlock, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import { FY_MS_LOGO } from './hackathonFyImages'
import { RT_BANNER_ART, RT_MS_LOGO_WHITE, RT_PARTNER_LOGO } from './registerTodayImages'
import type { Lang } from '../../lib/i18n'
import { starterT, type StarterT } from './lang'

/** Starter text in the new email's language, set when a starter is built. */
let T: StarterT = starterT('en')

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
const register = (shade?: string): BodyBlock => ({ id: id(), kind: 'button', label: T('Register now'), url: REGISTER_URL, align: 'left', color: DARK_TEAL, shade })
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

export function registerTodayStarter(lang: Lang = 'en'): CampaignBundle {
  T = starterT(lang)
  const base = defaultDesign(lang)
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
      heading(T('Join us for the Microsoft [Partner] Global Hackathon!')),
      text(
        T('<p>We’re excited to invite you to explore the upcoming <strong>Microsoft [Partner] Global Hackathon</strong> event. These immersive experiences are designed to spark innovation, giving you the chance to build, experiment, and create impactful solutions. Hackathon themes cover <strong>[themes, e.g. Building AI Agents using Microsoft AI Foundry &amp; Fabric solutions]</strong>. Take part in this transformative experience and empower yourself to drive innovation with AI.</p>'),
      ),
      {
        id: id(),
        kind: 'callout',
        html: `<p style="text-align:center"><span style="font-size:20px;color:${DARK_TEAL}">${T('[Start date] – [End date], [Year]')}</span><br>${T('[Start time] [Time zone]')}</p>`,
        background: '#FFFFFF',
        showRule: false,
        rule: '',
        text: '',
        border: TEAL,
      },
      text(
        T('<p>Bring your best ideas to the challenge—<strong>our top teams will earn [prizes, e.g. major prizes, including an exclusive celebration experience with standout gifts]</strong>. This is your chance to innovate, compete, and shine on a global stage.</p>'),
      ),
      register(),

      heading(T('Gain technical expertise from Hack Prep Workshops'), LIGHT_TEAL),
      text(
        T('<p>Delivered by Microsoft Subject Matter Experts (SMEs), these preparatory sessions empower attendees to showcase the potential of each technology and demonstrate how it can be applied to build real-world solutions.</p>'),
        LIGHT_TEAL,
      ),
      table(
        [
          [T('Date'), T('Live Workshops')],
          [T('[DD-Mon-YYYY]'), T('[Workshop topic]')],
          [T('[DD-Mon-YYYY]'), T('[Workshop topic]')],
          [T('[DD-Mon-YYYY]'), T('[Workshop topic]')],
        ],
        LIGHT_TEAL,
      ),
      text(
        T('<p>Attendees can <strong>also leverage self-paced courses</strong> to develop comprehensive expertise, enabling them to master advanced concepts at their own pace and reinforce hands-on learning from the workshops.</p>'),
        LIGHT_TEAL,
      ),
      table(
        [
          [T('Format'), T('Self-Paced Course Titles')],
          [T('Self-Paced'), T('[Course title](https://course-link)')],
          [T('Self-Paced'), T('[Course title](https://course-link)')],
          [T('Self-Paced'), T('[Course title](https://course-link)')],
        ],
        LIGHT_TEAL,
      ),

      heading(T('Bring your ideas to life at the Hackathon!'), WARM_WHITE),
      text(
        T('<p>You’ll work in a dynamic, team-based environment—gaining not only technical experience but also valuable mentorship and guidance from dedicated Microsoft subject matter experts. It’s a great opportunity to learn, create, and make a real impact.</p>'),
        WARM_WHITE,
      ),
      table(
        [
          [T('Date'), T('Stages')],
          [T('[DD-Mon-YYYY]'), T('Hackathon – Ideation & Submission')],
          [T('[DD-Mon-YYYY]'), T('Hackathon – Build & Submission')],
          [T('[DD-Mon-YYYY]'), T('Hackathon – Evaluation')],
          [T('[DD-Mon-YYYY]'), T('Hackathon Conclusion & Recognition')],
        ],
        WARM_WHITE,
      ),
      text(
        T('<p>Participants will gain practical experience in [what they will learn, e.g. orchestrating AI agents and integrating advanced capabilities into real-world applications].</p>'),
        WARM_WHITE,
      ),
      text(
        T('<p><strong>Looking to complete your year-end CRT requirements?</strong><br>This hackathon is the perfect springboard. The live workshops and self-paced courses included in the program map directly to the foundational learning behind several key certifications. While exams are still required, you’ll walk away with the knowledge, practice, and confidence to fast-track your CRT requirements and finish the year strong.</p>'),
        WARM_WHITE,
      ),
      register(WARM_WHITE),
    ],
    footer: {
      ...base.footer,
      background: DARK_TEAL,
      text: '#FFFFFF',
      html: `<p><span style="font-size:11px">${T('Let me know if you’d prefer I not forward you these communications. To learn how to manage your contact preferences for other parts of Microsoft, please read our <a href="{privacy}">Privacy Statement</a>.', { privacy: PRIVACY_URL })}</span></p>`,
      links: [],
      showMark: true,
      logo: RT_MS_LOGO_WHITE,
      legal: T('Microsoft Corporation\nOne Microsoft Way\nRedmond, WA 98052 USA\n© [Year] Microsoft Corporation. All rights reserved.'),
    },
  }

  const campaign = emptyCampaign('hackathon', lang)
  return {
    campaign: {
      ...campaign,
      name: T('Register Today'),
      subject: T('Invitation for the [Partner] Microsoft [Event name] Hackathon event | [Start date] - [End date], [Year]'),
      kicker: '',
      title: T('Microsoft [Event name] Hackathon'),
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
