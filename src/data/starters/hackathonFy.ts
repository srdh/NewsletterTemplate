import type { CampaignBundle } from '../../types'
import { defaultDesign, writeDesign, type BodyBlock, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import { FY_MS_LOGO, FY_PHOTO_PLACEHOLDER } from './hackathonFyImages'
import type { Lang } from '../../lib/i18n'
import { starterT, type StarterT } from './lang'

/** Starter text in the new email's language, set when a starter is built. */
let T: StarterT = starterT('en')

/*
 * Hackathons "FY Summary": a year-end report, generalized from the
 * "Microsoft Global Partner Hackathons – FY26 Year-end Summary" email.
 *
 * The structure, section headings, and the hackathon model descriptions are
 * kept; anything specific to one year (numbers, events, people, photos,
 * highlights) is a [placeholder] to fill in for the year being reported.
 */

function id(): string {
  return crypto.randomUUID()
}

const TEAL = '#008575'
const GREEN = '#02AE68'
const YELLOW = '#FCFC92'
const MINT = '#E2EFD9'
const SAGE = '#C3DEB0'
const INK = '#1B1B1B'

const bar = (title: string): BodyBlock => ({ id: id(), kind: 'heading', title, color: '#FFFFFF', rule: '', size: 16, fill: TEAL, outline: '' })
const pill = (title: string): BodyBlock => ({ id: id(), kind: 'heading', title, color: TEAL, rule: '', size: 15, fill: '', outline: TEAL })
const text = (html: string): BodyBlock => ({ id: id(), kind: 'text', html })
const tile = (label: string, background = MINT, color = INK) => ({ id: id(), value: '[0]', label, background, text: color })
const bullets = (...items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
const freeSpace = () => `<span style="background-color:#FFFF00">${T('[Free space to add text]')}</span>`

export function fySummaryStarter(lang: Lang = 'en'): CampaignBundle {
  T = starterT(lang)
  const base = defaultDesign(lang)
  const design: NewsletterDesign = {
    ...base,
    style: {
      ...base.style,
      accent: TEAL,
      link: '#0078D4',
      paper: '#F2F2F2',
      canvas: '#FFFFFF',
      font: 'Segoe UI',
      size: 14,
      frame: SAGE,
      width: 720,
    },
    banner: {
      ...base.banner,
      layout: 'band',
      align: 'left',
      background: '#E3F3F0',
      text: '#123B4A',
      showMark: true,
      logo: FY_MS_LOGO,
      rightLogo: '',
      dateLabel: '',
      imageAlt: '',
    },
    blocks: [
      bar(T('Program Overview')),
      text(
        T('<p>Driven by strong global partner demand, [FY] saw [what the year delivered, e.g. the launch of the Global Partner Hackathon initiative and a scalable framework to accelerate skilling, innovation, and solution development]. This summary recaps [FY] achievements and how the hackathon models catered to the requirements for various partner segments and regional campaigns.</p>'),
      ),
      pill(T('[FY] Hackathon Models at-a-glance')),
      {
        id: id(),
        kind: 'columns',
        columns: [
          {
            id: id(),
            title: T('Hack-In-A-Day (HIAD)'),
            headerBackground: '',
            headerText: '#123B4A',
            html: bullets(
              T('Time-boxed: solve the challenge and evaluate on the same day.'),
              T('Showcase individual capability on pre-defined business scenarios or a specific specialization.'),
              T('Build the readiness skills needed to accelerate the AI journey.'),
            ),
          },
          {
            id: id(),
            title: T('Hack to Skill (HTS)'),
            headerBackground: '',
            headerText: '#123B4A',
            html: bullets(
              T('Demonstrate individual, hands-on expertise in deploying solutions across Microsoft services and workloads.'),
              T('Solve multi-level challenges in a fixed duration of 2 to 5 days.'),
            ),
          },
          {
            id: id(),
            title: T('Hack to Build (HTB)'),
            headerBackground: '',
            headerText: '#123B4A',
            html: bullets(
              T('Customer-validated POCs mapped to solution plays.'),
              T('Packaged solution/IP with documentation, deployment scripts, and compliance artifacts.'),
              T('Clear GTM pathway (co-sell, marketplace listing, reference architecture).'),
            ),
          },
        ],
      },
      bar(T('Execution Summary')),
      {
        id: id(),
        kind: 'stats',
        leadTitle: '',
        leadCaption: '',
        leadBackground: YELLOW,
        tiles: [
          tile(T('Hackathons'), GREEN, '#FFFFFF'),
          tile(T('Private (1:1)'), YELLOW),
          tile(T('Regional multi-partner'), YELLOW),
          tile(T('Total registrations')),
          tile(T('Total participants')),
          tile(T('Agents deployed')),
        ],
      },
      bar(T('Hackathons Completed in [FY]')),
      {
        id: id(),
        kind: 'stats',
        leadTitle: T('Partner Mix'),
        leadCaption: T('(Private 1:1 Events)'),
        leadBackground: YELLOW,
        tiles: [
          tile(T('Commercial'), SAGE),
          tile(T('Digitech'), MINT),
          tile(T('Advisory'), SAGE),
          tile(T('Ent SI'), MINT),
          tile(T('Distributor'), SAGE),
          tile(T('Telco'), MINT),
          tile(T('SSP'), SAGE),
        ],
      },
      pill(T('Private 1:1 Partner Events')),
      {
        id: id(),
        kind: 'table',
        title: '',
        header: true,
        rows: [
          [T('Partner · Event Name'), T('Type · Timeline'), T('Registrations'), T('Participants'), T('Agents Deployed')],
          [T('[Partner] · [Event name]'), T('[HIAD / HTS / HTB] · [Mon YYYY]'), '[0]', '[0]', '[0]'],
          [T('[Partner] · [Event name]'), T('[HIAD / HTS / HTB] · [Mon YYYY]'), '[0]', '[0]', '[0]'],
          [T('[Partner] · [Event name]'), T('[HIAD / HTS / HTB] · [Mon YYYY]'), '[0]', '[0]', '[0]'],
        ],
        headerBackground: '#D9D9D9',
        headerText: INK,
        border: '#E4E4E4',
        striped: true,
      },
      pill(T('Regional Multi-partner Events')),
      {
        id: id(),
        kind: 'table',
        title: '',
        header: true,
        rows: [
          [T('Event Name · Timeline'), T('Registrations'), T('Participants'), T('Agents Deployed')],
          [T('[Region] [Event name] · [Mon YYYY]'), '[0]', '[0]', '[0]'],
          [T('[Region] [Event name] · [Mon YYYY]'), '[0]', '[0]', '[0]'],
        ],
        headerBackground: GREEN,
        headerText: '#FFFFFF',
        border: '#E4E4E4',
        striped: true,
      },
      bar(T('Event Snapshots')),
      {
        id: id(),
        kind: 'gallery',
        columns: 3,
        images: [1, 2, 3].map((n) => ({ id: id(), src: FY_PHOTO_PLACEHOLDER, alt: T('[Event photo {n}]', { n }) })),
      },
      bar(T('Key Highlights, Signals & Learnings')),
      {
        id: id(),
        kind: 'columns',
        columns: [
          { id: id(), title: T('[Highlight 1, e.g. HIAD is the workhorse]'), headerBackground: SAGE, headerText: INK, html: bullets(T('[Key point]'), T('[Key point]')) },
          { id: id(), title: T('[Highlight 2, e.g. Regional hackathons]'), headerBackground: YELLOW, headerText: INK, html: bullets(T('[Key point]'), T('[Key point]')) },
          { id: id(), title: T('[Highlight 3, e.g. Disti and reseller hackathons]'), headerBackground: MINT, headerText: INK, html: bullets(T('[Key point]'), T('[Key point]')) },
        ],
      },
      {
        id: id(),
        kind: 'columns',
        columns: [
          { id: id(), title: T('Strong Positive Feedback'), headerBackground: GREEN, headerText: '#FFFFFF', html: bullets(T('[Feedback]'), T('[Feedback]')) },
          { id: id(), title: T('Help Needed | Partner Signals'), headerBackground: YELLOW, headerText: INK, html: bullets(T('[Signal or request]'), T('[Signal or request]')) },
        ],
      },
      bar(T('With Appreciation')),
      text(
        T('<p>Extending our sincere appreciation to our skilling leads and sponsors for your continued trust, collaboration, and support. Your commitment plays a crucial role in our collective success in driving the Hackathon initiatives forward.</p>'),
      ),
      {
        id: id(),
        kind: 'people',
        title: T('Microsoft Sponsors'),
        headerBackground: SAGE,
        columns: 3,
        people: [
          { id: id(), photo: '', name: T('[Sponsor name]'), role: T('[Title]'), detail: '' },
          { id: id(), photo: '', name: T('[Sponsor name]'), role: T('[Title]'), detail: '' },
        ],
      },
      {
        id: id(),
        kind: 'people',
        title: T('[Team] Skilling Leads'),
        headerBackground: MINT,
        columns: 3,
        people: Array.from({ length: 6 }, () => ({ id: id(), photo: '', name: T('[Name]'), role: T('Transformation Lead'), detail: T('[Partners covered]') })),
      },
      text(`<p>${freeSpace()}</p>`),
      bar(T('Thank You')),
      text(`<p>${freeSpace()}</p><p><strong>${T('[Sender name]')}</strong></p>`),
      text(T('<p style="text-align:right"><span style="color:#008575;font-size:11px">MICROSOFT CONFIDENTIAL – FOR INTERNAL USE ONLY</span></p>')),
      { id: id(), kind: 'signature', signoff: T('Regards,'), name: T('[Your name]'), role: T('[Your title] – [Team]'), team: '', email: '', photo: '' },
    ],
    footer: {
      ...base.footer,
      background: '#FFFFFF',
      text: '#595959',
      html: '',
      links: [],
      showMark: true,
      logo: FY_MS_LOGO,
      legal: '',
    },
  }

  const campaign = emptyCampaign('hackathon', lang)
  return {
    campaign: {
      ...campaign,
      name: T('FY Summary'),
      subject: T('Microsoft Global Partner Hackathons – [FY] Year-end Summary'),
      kicker: '',
      title: T('Microsoft Global Partner Hackathon'),
      subtitle: T('[FY] Summary and Highlights'),
      register_label: '',
      register_url: '',
      banner_image: '',
      newsletter: writeDesign(design),
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}
