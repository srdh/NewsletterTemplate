import type { CampaignBundle } from '../../types'
import { PRIVACY_URL, THEMES, defaultDesign, writeDesign, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'

/*
 * Custom 2: a block-by-block email, edited one block at a time. It starts as
 * a regional event announcement (banner, text, event card, table, spotlight
 * cards, call to action, signature) with placeholders to replace.
 */

function id(): string {
  return crypto.randomUUID()
}

export function custom2Starter(): CampaignBundle {
  const forest = THEMES[0]
  const base = defaultDesign()
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
          '<p>Hi [first name],</p>' +
          '<p>We’re excited to announce the upcoming <strong>Build What’s Next with Partner Skilling</strong> event in [region]. Join us for a focused session on the latest AI skilling, programs, and resources to help your teams grow.</p>',
      },
      {
        id: id(),
        kind: 'event',
        title: 'Event overview',
        date: '[Day, Month DD, YYYY]',
        time: '[00:00–00:00 time zone]',
        location: 'Microsoft Teams (online)',
        html: '<p>A live session with Microsoft experts, partner stories, and time for your questions.</p>',
        buttonLabel: 'Add to calendar',
        buttonUrl: '',
        background: '#EBF3EF',
        accent: '',
      },
      {
        id: id(),
        kind: 'table',
        title: 'Agenda',
        header: true,
        rows: [
          ['Time', 'Session', 'Speaker'],
          ['[00:00]', 'Welcome and what’s new in Partner Skilling', '[Name]'],
          ['[00:00]', 'AI skilling journeys for your roles', '[Name]'],
          ['[00:00]', 'Partner spotlight and Q&A', '[Name]'],
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
            title: 'AI Workforce journeys',
            html: '<p>Role-based learning paths for sales, pre-sales, and technical teams.</p>',
            linkLabel: 'Explore journeys',
            linkUrl: '',
          },
          {
            id: id(),
            image: '',
            title: 'Partner Skilling Hub',
            html: '<p>Live and on-demand sessions, all in one place.</p>',
            linkLabel: 'Visit the hub',
            linkUrl: '',
          },
        ],
      },
      { id: id(), kind: 'button', label: 'Register now', url: '', align: 'left', color: '' },
      {
        id: id(),
        kind: 'signature',
        signoff: 'Thanks,',
        name: 'Your name',
        role: '',
        team: 'Partner Skilling',
        email: '',
        photo: '',
      },
    ],
    footer: {
      ...base.footer,
      background: '#F5F5F5',
      text: '#505050',
      html: '<p>You are receiving this email because you are part of the Microsoft Partner Skilling community.</p>',
      links: [{ id: id(), label: 'Privacy Statement', url: PRIVACY_URL }],
    },
  }

  const campaign = emptyCampaign('custom2')
  return {
    campaign: {
      ...campaign,
      name: 'Untitled campaign',
      subject: 'Build What’s Next with Partner Skilling | [Region]',
      kicker: 'REGION - MONTH YEAR',
      title: 'Build What’s Next with Partner Skilling',
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
