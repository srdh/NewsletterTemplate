import type { CampaignBundle } from '../../types'
import { PRIVACY_URL, THEMES, defaultDesign, writeDesign, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import type { Lang } from '../../lib/i18n'
import { starterT, type StarterT } from './lang'

/** Starter text in the new email's language, set when a starter is built. */
let T: StarterT = starterT('en')

/*
 * Custom 2: a block-by-block email, edited one block at a time. It starts as
 * a regional event announcement (banner, text, event card, table, spotlight
 * cards, call to action, signature) with placeholders to replace.
 */

function id(): string {
  return crypto.randomUUID()
}

export function custom2Starter(lang: Lang = 'en'): CampaignBundle {
  T = starterT(lang)
  const forest = THEMES[0]
  const base = defaultDesign(lang)
  const design: NewsletterDesign = {
    ...base,
    style: { ...base.style, paper: '#FFFFFF', canvas: '#FFFFFF' },
    banner: {
      ...base.banner,
      layout: 'band',
      align: 'left',
      background: forest.banner,
      text: forest.bannerText,
      showMark: true,
      dateLabel: '',
    },
    blocks: [
      {
        id: id(),
        kind: 'text',
        html:
          T('<p>Hi [first name],</p>') +
          T('<p>We’re excited to announce the upcoming <strong>Build What’s Next with Partner Skilling</strong> event in [region]. Join us for a focused session on the latest AI skilling, programs, and resources to help your teams grow.</p>'),
      },
      {
        id: id(),
        kind: 'event',
        title: T('Event overview'),
        date: T('[Day, Month DD, YYYY]'),
        time: T('[00:00–00:00 time zone]'),
        location: T('Microsoft Teams (online)'),
        html: T('<p>A live session with Microsoft experts, partner stories, and time for your questions.</p>'),
        buttonLabel: T('Add to calendar'),
        buttonUrl: '',
        background: '#EBF3EF',
        accent: '',
      },
      {
        id: id(),
        kind: 'table',
        title: T('Agenda'),
        header: true,
        rows: [
          [T('Time'), T('Session'), T('Speaker')],
          ['[00:00]', T('Welcome and what’s new in Partner Skilling'), T('[Name]')],
          ['[00:00]', T('AI skilling journeys for your roles'), T('[Name]')],
          ['[00:00]', T('Partner spotlight and Q&A'), T('[Name]')],
        ],
        headerBackground: '#0B4F38',
        headerText: '#FFFFFF',
        border: '#D1D1D1',
        striped: true,
      },
      {
        id: id(),
        kind: 'spotlights',
        background: '#FFFFFF',
        border: '#E0E0E0',
        cards: [
          {
            id: id(),
            image: '',
            title: T('AI Workforce journeys'),
            html: T('<p>Role-based learning paths for sales, pre-sales, and technical teams.</p>'),
            linkLabel: T('Explore journeys'),
            linkUrl: '',
          },
          {
            id: id(),
            image: '',
            title: T('Partner Skilling Hub'),
            html: T('<p>Live and on-demand sessions, all in one place.</p>'),
            linkLabel: T('Visit the hub'),
            linkUrl: '',
          },
        ],
      },
      { id: id(), kind: 'button', label: T('Register now'), url: '', align: 'left', color: '' },
      {
        id: id(),
        kind: 'signature',
        signoff: T('Thanks,'),
        name: T('Your name'),
        role: '',
        team: T('Partner Skilling'),
        email: '',
        photo: '',
      },
    ],
    footer: {
      ...base.footer,
      background: '#F5F5F5',
      text: '#505050',
      html: T('<p>You are receiving this email because you are part of the Microsoft Partner Skilling community.</p>'),
      links: [{ id: id(), label: T('Privacy Statement'), url: PRIVACY_URL }],
    },
  }

  const campaign = emptyCampaign('custom2', lang)
  return {
    campaign: {
      ...campaign,
      name: T('Untitled campaign'),
      subject: T('Build What’s Next with Partner Skilling | [Region]'),
      kicker: T('REGION - MONTH YEAR'),
      title: T('Build What’s Next with Partner Skilling'),
      subtitle: '',
      register_label: '',
      register_url: '',
      newsletter: writeDesign(design),
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}
