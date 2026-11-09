import type { CampaignBundle } from '../../types'
import { defaultDesign, writeDesign, type BodyBlock, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import { FY_MS_LOGO, FY_PHOTO_PLACEHOLDER } from './hackathonFyImages'

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
const freeSpace = '<span style="background-color:#FFFF00">[Free space to add text]</span>'

export function fySummaryStarter(): CampaignBundle {
  const base = defaultDesign()
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
      bar('Program Overview'),
      text(
        '<p>Driven by strong global partner demand, [FY] saw [what the year delivered, e.g. the launch of the Global Partner Hackathon initiative and a scalable framework to accelerate skilling, innovation, and solution development]. This summary recaps [FY] achievements and how the hackathon models catered to the requirements for various partner segments and regional campaigns.</p>',
      ),
      pill('[FY] Hackathon Models at-a-glance'),
      {
        id: id(),
        kind: 'columns',
        columns: [
          {
            id: id(),
            title: 'Hack-In-A-Day (HIAD)',
            headerBackground: '',
            headerText: '#123B4A',
            html: bullets(
              'Time-boxed: solve the challenge and evaluate on the same day.',
              'Showcase individual capability on pre-defined business scenarios or a specific specialization.',
              'Build the readiness skills needed to accelerate the AI journey.',
            ),
          },
          {
            id: id(),
            title: 'Hack to Skill (HTS)',
            headerBackground: '',
            headerText: '#123B4A',
            html: bullets(
              'Demonstrate individual, hands-on expertise in deploying solutions across Microsoft services and workloads.',
              'Solve multi-level challenges in a fixed duration of 2 to 5 days.',
            ),
          },
          {
            id: id(),
            title: 'Hack to Build (HTB)',
            headerBackground: '',
            headerText: '#123B4A',
            html: bullets(
              'Customer-validated POCs mapped to solution plays.',
              'Packaged solution/IP with documentation, deployment scripts, and compliance artifacts.',
              'Clear GTM pathway (co-sell, marketplace listing, reference architecture).',
            ),
          },
        ],
      },
      bar('Execution Summary'),
      {
        id: id(),
        kind: 'stats',
        leadTitle: '',
        leadCaption: '',
        leadBackground: YELLOW,
        tiles: [
          tile('Hackathons', GREEN, '#FFFFFF'),
          tile('Private (1:1)', YELLOW),
          tile('Regional multi-partner', YELLOW),
          tile('Total registrations'),
          tile('Total participants'),
          tile('Agents deployed'),
        ],
      },
      bar('Hackathons Completed in [FY]'),
      {
        id: id(),
        kind: 'stats',
        leadTitle: 'Partner Mix',
        leadCaption: '(Private 1:1 Events)',
        leadBackground: YELLOW,
        tiles: [
          tile('Commercial', SAGE),
          tile('Digitech', MINT),
          tile('Advisory', SAGE),
          tile('Ent SI', MINT),
          tile('Distributor', SAGE),
          tile('Telco', MINT),
          tile('SSP', SAGE),
        ],
      },
      pill('Private 1:1 Partner Events'),
      {
        id: id(),
        kind: 'table',
        title: '',
        header: true,
        rows: [
          ['Partner · Event Name', 'Type · Timeline', 'Registrations', 'Participants', 'Agents Deployed'],
          ['[Partner] · [Event name]', '[HIAD / HTS / HTB] · [Mon YYYY]', '[0]', '[0]', '[0]'],
          ['[Partner] · [Event name]', '[HIAD / HTS / HTB] · [Mon YYYY]', '[0]', '[0]', '[0]'],
          ['[Partner] · [Event name]', '[HIAD / HTS / HTB] · [Mon YYYY]', '[0]', '[0]', '[0]'],
        ],
        headerBackground: '#D9D9D9',
        headerText: INK,
        border: '#E4E4E4',
        striped: true,
      },
      pill('Regional Multi-partner Events'),
      {
        id: id(),
        kind: 'table',
        title: '',
        header: true,
        rows: [
          ['Event Name · Timeline', 'Registrations', 'Participants', 'Agents Deployed'],
          ['[Region] [Event name] · [Mon YYYY]', '[0]', '[0]', '[0]'],
          ['[Region] [Event name] · [Mon YYYY]', '[0]', '[0]', '[0]'],
        ],
        headerBackground: GREEN,
        headerText: '#FFFFFF',
        border: '#E4E4E4',
        striped: true,
      },
      bar('Event Snapshots'),
      {
        id: id(),
        kind: 'gallery',
        columns: 3,
        images: [1, 2, 3].map((n) => ({ id: id(), src: FY_PHOTO_PLACEHOLDER, alt: `[Event photo ${n}]` })),
      },
      bar('Key Highlights, Signals & Learnings'),
      {
        id: id(),
        kind: 'columns',
        columns: [
          { id: id(), title: '[Highlight 1, e.g. HIAD is the workhorse]', headerBackground: SAGE, headerText: INK, html: bullets('[Key point]', '[Key point]') },
          { id: id(), title: '[Highlight 2, e.g. Regional hackathons]', headerBackground: YELLOW, headerText: INK, html: bullets('[Key point]', '[Key point]') },
          { id: id(), title: '[Highlight 3, e.g. Disti and reseller hackathons]', headerBackground: MINT, headerText: INK, html: bullets('[Key point]', '[Key point]') },
        ],
      },
      {
        id: id(),
        kind: 'columns',
        columns: [
          { id: id(), title: 'Strong Positive Feedback', headerBackground: GREEN, headerText: '#FFFFFF', html: bullets('[Feedback]', '[Feedback]') },
          { id: id(), title: 'Help Needed | Partner Signals', headerBackground: YELLOW, headerText: INK, html: bullets('[Signal or request]', '[Signal or request]') },
        ],
      },
      bar('With Appreciation'),
      text(
        '<p>Extending our sincere appreciation to our skilling leads and sponsors for your continued trust, collaboration, and support. Your commitment plays a crucial role in our collective success in driving the Hackathon initiatives forward.</p>',
      ),
      {
        id: id(),
        kind: 'people',
        title: 'Microsoft Sponsors',
        headerBackground: SAGE,
        columns: 3,
        people: [
          { id: id(), photo: '', name: '[Sponsor name]', role: '[Title]', detail: '' },
          { id: id(), photo: '', name: '[Sponsor name]', role: '[Title]', detail: '' },
        ],
      },
      {
        id: id(),
        kind: 'people',
        title: '[Team] Skilling Leads',
        headerBackground: MINT,
        columns: 3,
        people: Array.from({ length: 6 }, () => ({ id: id(), photo: '', name: '[Name]', role: 'Transformation Lead', detail: '[Partners covered]' })),
      },
      text(`<p>${freeSpace}</p>`),
      bar('Thank You'),
      text(`<p>${freeSpace}</p><p><strong>[Sender name]</strong></p>`),
      text('<p style="text-align:right"><span style="color:#008575;font-size:11px">MICROSOFT CONFIDENTIAL – FOR INTERNAL USE ONLY</span></p>'),
      { id: id(), kind: 'signature', signoff: 'Regards,', name: '[Your name]', role: '[Your title] – [Team]', team: '', email: '', photo: '' },
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

  const campaign = emptyCampaign('hackathon')
  return {
    campaign: {
      ...campaign,
      name: 'FY Summary',
      subject: 'Microsoft Global Partner Hackathons – [FY] Year-end Summary',
      kicker: '',
      title: 'Microsoft Global Partner Hackathon',
      subtitle: '[FY] Summary and Highlights',
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
