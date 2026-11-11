import type {
  AgendaItem,
  Campaign,
  CampaignBundle,
  EventRow,
  MasterType,
  SpotlightCard,
} from '../types'
import { defaultDesign, PRIVACY_URL, THEMES, writeDesign, type NewsletterDesign } from '../lib/newsletter'
import { emailT } from '../lib/emailText'
import type { Lang } from '../lib/i18n'

function id(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function campaign(
  partial: Omit<Campaign, 'created_at' | 'updated_at'> & { created_at?: string },
): Campaign {
  const stamp = now()
  return { created_at: stamp, updated_at: stamp, newsletter: '', ...partial }
}

/** A new, empty campaign; its default text is in the given email language. */
export function emptyCampaign(master: MasterType, lang: Lang = 'en'): Campaign {
  const T = emailT(lang)
  const base = campaign({
    id: id(),
    master_type: master,
    name: T('Untitled campaign'),
    subject: '',
    region: '',
    kicker: '',
    title: '',
    greeting: T('Hi all,'),
    intro: '',
    event_name: '',
    event_url: '',
    event_date_label: '',
    event_time_label: '',
    language_note: '',
    overview_body: '',
    action_heading: '',
    action_body: '',
    register_label: '',
    register_url: '',
    secondary_cta_label: '',
    secondary_cta_url: '',
    signoff_thanks: '',
    signer_name: '',
    signer_title: '',
    signer_email: '',
    month_label: '',
    subtitle: '',
    contents_intro: '',
    snapshot_date: '',
    callouts: '',
    banner_image: '',
    section_image: '',
    language: lang,
  })

  if (master === 'newsletter') {
    const design = defaultDesign(lang)
    return {
      ...base,
      name: T('New newsletter'),
      kicker: 'Microsoft Partner Skilling',
      title: T('Partner Skilling Newsletter'),
      subtitle: '',
      newsletter: writeDesign(design),
    }
  }
  if (master === 'event_invite') {
    return {
      ...base,
      name: T('New event invite'),
      title: T('Build What’s Next with Partner Skilling'),
      kicker: T('REGION- MONTH YEAR'),
      action_heading: T('ACTION: Invite your partners to this event'),
      signer_name: 'Priya Menon',
      signer_title: T('Asia Partner Skilling Strategy Lead'),
    }
  }
  if (master === 'monthly_update') {
    return {
      ...base,
      name: T('New monthly update'),
      title: T('Partner Skilling Update'),
      subtitle: T('AI Workforce'),
    }
  }
  return {
    ...base,
    name: T('New weekly snapshot'),
    title: T('Weekly project snapshot'),
    greeting: T('Hi team,'),
  }
}

export function seedBundles(): CampaignBundle[] {
  const asiaId = '0f6c2d1a-6a0a-4d2e-9c2b-0000000000a1'
  const monthlyId = '0f6c2d1a-6a0a-4d2e-9c2b-0000000000b2'
  const weeklyId = '0f6c2d1a-6a0a-4d2e-9c2b-0000000000c3'

  const asia: Campaign = campaign({
    id: asiaId,
    master_type: 'event_invite',
    name: 'ASIA · Sep 2026 · Build What’s Next',
    subject:
      'Use Skilling to drive impact | Build What’s Next with Partner Skilling (ASIA)',
    region: 'ASIA',
    kicker: 'ASIA- SEPTEMBER 2026',
    title: 'Build What’s Next with Partner Skilling',
    greeting: 'Hi all,',
    intro: `We’re excited to announce the upcoming [Build What’s Next with Partner Skilling session for ASIA](https://aka.ms/BuildWhatsNextASIA). This is an informational series that helps partners turn AI opportunities into revenue, accelerate technical intensity, and drive faster business impact.

This is the perfect opportunity for partners to get a first look at what’s new, what’s coming, and how to take advantage of the latest Partner Skilling initiatives, programs, and resources available this year.`,
    event_name: 'Build What’s Next with Partner Skilling for ASIA – September 2026',
    event_url: 'https://aka.ms/BuildWhatsNextASIA',
    event_date_label: 'Tuesday, September 8, 2026',
    event_time_label: '9:00 AM – 10:15 AM (India Standard Time)',
    language_note:
      'This event will be delivered in English. Multi-language closed captioning will be available for 简体中文, 繁體中文, 日本語, and 한국어.',
    overview_body: `Microsoft Partner Skilling helps partners build the sales, pre-sales, and technical delivery capabilities needed to accelerate customer value, strengthen execution, and unlock new AI and cloud opportunities. We will highlight all the programs and resources available to partners to skill up, earn designations, and build what’s next. This new September 2026 session will cover:`,
    action_heading: 'ACTION: Invite your partners to this event',
    action_body: `We’d love your help to invite partners to this event. Please use the attached localized emails we’ve prepared to send directly to your partners. All internal team members can also [Register here](https://aka.ms/BuildWhatsNextASIA).

If you’d like to drive awareness of the event, feel free to repost our LinkedIn post [here](https://www.linkedin.com).`,
    register_label: 'Register here',
    register_url: 'https://aka.ms/BuildWhatsNextASIA',
    secondary_cta_label: 'LinkedIn post',
    secondary_cta_url: 'https://www.linkedin.com',
    signoff_thanks: 'Thank you for helping your partners build what’s next.',
    signer_name: 'Priya Menon',
    signer_title: 'Asia Partner Skilling Strategy Lead',
    signer_email: 'priya.menon@example.com',
    month_label: '',
    subtitle: '',
    contents_intro: '',
    snapshot_date: '',
    callouts: '',
    banner_image: '',
    section_image: '',
  })

  const asiaAgenda: AgendaItem[] = [
    'Welcome & Key Takeaways',
    'FY27 Strategy Overview',
    'FY27 Initiatives & Priorities',
    'Partner Skilling Content Priorities',
    'Platform Updates',
    'Organizational Skilling',
    'Hackathons',
  ].map((text, sort_order) => ({
    id: `0f6c2d1a-6a0a-4d2e-9c2b-00000000a1${String(sort_order).padStart(2, '0')}`,
    campaign_id: asiaId,
    sort_order,
    text,
  }))

  const monthly: Campaign = campaign({
    id: monthlyId,
    master_type: 'monthly_update',
    name: 'Sep 2026 · Partner Skilling Update · AI Workforce',
    subject: 'Microsoft Partner Skilling Update | AI Workforce',
    region: 'Global',
    kicker: '',
    title: 'Partner Skilling Update',
    greeting: '',
    intro:
      'More opportunities to strengthen your AI Workforce expertise, helping you grow your AI technical practice and unlocking new business opportunities. Join us. Upcoming and on-demand skilling offerings for Partners.',
    event_name: '',
    event_url: '',
    event_date_label: '',
    event_time_label: '',
    language_note: '',
    overview_body: '',
    action_heading: 'Call to Action',
    action_body: `- Please forward this email within your internal teams, set up meetings from our page and commit to the opportunity.
- If you haven’t already signed up on the [Skilling Hub](https://aka.ms/PartnerSkilling), please do so. Once on the Hub, you can pick up your next skilling sessions that match your business needs.
- Visit the [Skilling Resources page](https://aka.ms/PartnerSkillingNews) to discover the latest skilling event calendars, playbooks, and updates.`,
    register_label: '',
    register_url: '',
    secondary_cta_label: '',
    secondary_cta_url: '',
    signoff_thanks: 'Thank you for your support.',
    signer_name: 'Chris Stoney',
    signer_title: 'Partner Skilling – AI Business Solutions, AI Workforce',
    signer_email: '',
    month_label: 'September 2026',
    subtitle: 'AI Workforce',
    contents_intro:
      'Let us know if you prefer that we send you these communications. To learn how to manage your contact preferences, see our privacy statement.',
    snapshot_date: '',
    callouts: '',
    banner_image: '',
    section_image: '',
  })

  const spotlights: SpotlightCard[] = [
    {
      id: '0f6c2d1a-6a0a-4d2e-9c2b-00000000b200',
      campaign_id: monthlyId,
      sort_order: 0,
      headline: 'Build Frontier Firm Productivity with Work IQ, Copilot, & Agents for SMB',
      image_url: '',
      body: 'Learn how Microsoft 365 Copilot, Work IQ, and AI agents help small businesses automate everyday work, improve conversations, and deliver more value without IT resources.',
      bullets: `Two-day, in-person learning experience includes two fallback days of:
- Business/technical workshop theory
- Hands-on Labs
- Q&A with technical experts`,
      cta_label: 'Register now!',
      cta_url: 'https://aka.ms/FrontierSMB',
    },
    {
      id: '0f6c2d1a-6a0a-4d2e-9c2b-00000000b201',
      campaign_id: monthlyId,
      sort_order: 1,
      headline: 'Copilot Usage-Based Billing Cost Management',
      image_url: '',
      body: 'Help your customers manage and govern Microsoft 365 Copilot and agent consumption using consumption billing.',
      bullets: `In this 1-day hands-on training experience, you’ll learn to optimize cost controls and include AI spend for your:
- configuring billing policies
- setting user and agent spending limits
- implementing chargebacks
- establishing consumption trends using the Microsoft 365 Admin Center and Copilot Control System`,
      cta_label: 'Register now!',
      cta_url: 'https://aka.ms/CopilotBilling',
    },
    {
      id: '0f6c2d1a-6a0a-4d2e-9c2b-00000000b202',
      campaign_id: monthlyId,
      sort_order: 2,
      headline: 'Promptathon: Prompting Techniques for Everyday Productivity',
      image_url: '',
      body: 'Turn everyday Microsoft 365 Copilot users into confident prompt engineers.',
      bullets: `This 1-day live, virtual hands-on workshop you will:
- Learn the SCQA framework (Plus Context, Source, Capabilities)
- Master more techniques such as persona, audience, and chain-of-thought prompting
- Apply them in live exercises across Word, Excel, PowerPoint, Teams, and Outlook
- Finish with a Mini-Promptathon challenge`,
      cta_label: 'Register now!',
      cta_url: 'https://aka.ms/Promptathon',
    },
  ]

  const monthlyRows: EventRow[] = [
    row(monthlyId, 'virtual_skilling', 0, {
      title: 'Build Frontier Firm Productivity with Work IQ, Copilot, & Agents for SMB',
      title_url: 'https://aka.ms/FrontierSMB',
      col_a: 'Work IQ, Copilot Studio, Microsoft Copilot',
      col_b: 'September 14-15 | 9:00 AM – 1:00 PM IST',
    }),
    row(monthlyId, 'virtual_skilling', 1, {
      title: 'AI models in Microsoft 365 Copilot',
      title_url: 'https://aka.ms/AIModelsCopilot',
      col_a: 'Microsoft Copilot',
      col_b: 'September 22-23 | 9:00 AM – 11:00 AM IST',
    }),
    row(monthlyId, 'virtual_skilling', 2, {
      title: 'Copilot Usage-Based Billing Cost Management',
      title_url: 'https://aka.ms/CopilotBilling',
      col_a: 'Copilot Control System, Microsoft Copilot',
      col_b: 'September 24-25 | 9:00 AM – 11:00 AM IST',
    }),
    row(monthlyId, 'virtual_skilling', 3, {
      title: 'Promptathon: Prompting Techniques for Everyday Productivity',
      title_url: 'https://aka.ms/Promptathon',
      col_a: 'Microsoft Copilot',
      col_b: 'September 28-29 | 9:00 AM – 1:00 PM IST',
    }),
    row(monthlyId, 'on_demand', 0, {
      title: 'Copilot Sales Ready Learning Journey (SMB)',
      title_url: 'https://aka.ms/CopilotSalesReadySMB',
      col_a: 'Work IQ, Copilot Studio, Microsoft Copilot',
      col_b: 'aka.ms/CopilotSalesReadySMB',
    }),
    row(monthlyId, 'on_demand', 1, {
      title: 'Copilot Project Ready Learning Journey (SMB)',
      title_url: 'https://aka.ms/CopilotProjectReadySMB',
      col_a: 'Work IQ, Copilot Studio, Microsoft Copilot',
      col_b: 'aka.ms/CopilotProjectReadySMB',
    }),
    row(monthlyId, 'on_demand', 2, {
      title: 'Copilot Sales Ready Learning Journey (ENT)',
      title_url: 'https://aka.ms/CopilotSalesReadyENT',
      col_a: 'Microsoft Copilot',
      col_b: 'aka.ms/CopilotSalesReadyENT',
    }),
  ]

  const weekly: Campaign = campaign({
    id: weeklyId,
    master_type: 'weekly_snapshot',
    name: '08/11 · Weekly project snapshot',
    subject: 'Weekly project snapshot | 08/11',
    region: '',
    kicker: '',
    title: 'Weekly project snapshot',
    greeting: 'Hi team,',
    intro:
      'Here’s your weekly snapshot of where things stand across the different GCPS Skilling projects. A few notes on how to read this update email: specific things to note are in yellow. Dates and quotes for in-progress work will shift as levels firm up or plans change, and we’ll flag any changes in the revised Due Date column.',
    event_name: '',
    event_url: '',
    event_date_label: '',
    event_time_label: '',
    language_note: '',
    overview_body:
      'These are projects that are through the kick-off phase and are actively being worked on. Time and scope and timing may fluctuate as details are clarified. We later should reflect the latest adjustments as of this week.',
    action_heading: '',
    action_body: `As always, you can send any new requests through the Marketing Request form. We’ll then follow up according to the processes outlined in our Working with Delightful documents.

For any questions on quotes/due dates, how we’re tracking against the POs, or other details, please reach out to Kayla Horton.

Have a great week,
The Delightful Team`,
    register_label: 'Marketing request form',
    register_url: 'https://aka.ms/MarketingRequest',
    secondary_cta_label: 'Working with Delightful',
    secondary_cta_url: 'https://aka.ms/WorkingWithDelightful',
    signoff_thanks: '',
    signer_name: 'The Delightful Team',
    signer_title: '',
    signer_email: '',
    month_label: '',
    subtitle: '',
    contents_intro: '',
    snapshot_date: '08/11',
    callouts: `- Two marketing items submitted this past week; two quotes still pending approval.
- Tony is OOO from 8/17/26 to 8/28/26. Kayla and Melissa will be covering for uninterrupted support.
- Currently tracking at 60% of our ad hoc budget for H1.`,
    banner_image: '',
    section_image: '',
  })

  const weeklyRows: EventRow[] = [
    row(weeklyId, 'new_requests', 0, {
      title: 'FY27 Build What’s Next Presentation Deck / Partner Pitch',
      col_a: 'Devi / Sorin',
      col_b: '8/11/26',
      col_c: 'Initial week of 8/18/26',
      col_d: 'Partner deck delivered to Delightful to start. Remaining follow-ups.',
      col_e: '$1,250',
      col_f: 'Pending approval',
      col_g: 'In evaluation',
      highlight: 'yellow',
    }),
    row(weeklyId, 'new_requests', 1, {
      title: 'Hackathon playbook (link back to FY27 later US)',
      col_a: 'Wafaa / Pingwin',
      col_b: '7/15/26',
      col_c: 'TBD pending approval',
      col_d: 'Requested that this sit with Wafaa for review',
      col_e: '$4,800',
      col_f: 'Pending approval',
      col_g: 'In evaluation',
      highlight: 'yellow',
    }),
    row(weeklyId, 'new_requests', 2, {
      title: 'Skilling capacity OFTs / One-pager',
      col_a: 'Deepak Anil',
      col_b: '7/15/26',
      col_c: 'TBD based on reviews',
      col_d: 'Live follow-up on SCO. Need clarification on scope/project.',
      col_e: 'TBD on quote',
      col_f: '',
      col_g: 'In evaluation',
      highlight: 'green',
    }),
    row(weeklyId, 'work_in_progress', 0, {
      title: 'Titan Badge Completion OFTs + Social Graphic',
      col_a: 'Ryan / Sorin',
      col_b: 'TBD/OK',
      col_c: 'Project owner review',
      col_d: '$3,750',
      col_g: 'Within 50% of budget used',
      highlight: 'green',
    }),
    row(weeklyId, 'work_in_progress', 1, {
      title: 'Frontier Executive Journey OFTs',
      col_a: 'Ben Elligan',
      col_b: 'TBD/OK',
      col_c: 'Project owner review',
      col_d: '$3,850',
      col_g: 'Within 50% of budget used',
      highlight: 'green',
    }),
    row(weeklyId, 'work_in_progress', 2, {
      title: 'Accelerate CSP OFTs (six logos, five page banner)',
      col_a: 'Neha Gupta / 2 Page Ready',
      col_b: 'TBD/OK',
      col_c: 'Edits underway (round 1)',
      col_d: '$1,850',
      col_g: 'Within 75% of budget used',
      highlight: 'orange',
    }),
    row(weeklyId, 'completed', 0, {
      title: 'Microsoft Certification Weeks: AI, Security, and AI Business Solutions',
      col_a: 'Regional Leads',
      col_b: '7/30/26',
      col_c: 'N/A',
      col_d: 'No changes. on plan.',
      col_g: 'Within 50% of budget used',
      highlight: 'green',
    }),
    row(weeklyId, 'completed', 1, {
      title: 'Organizational Skilling Playbook Refresh',
      col_a: 'Wafaa / Marina',
      col_b: '8/1/26',
      col_c: 'N/A',
      col_d: 'No changes. on plan.',
      col_g: 'Within 50% of budget used',
      highlight: 'green',
    }),
  ]

  return [
    newsletterSeed(),
    { campaign: asia, agenda: asiaAgenda, spotlights: [], rows: [] },
    { campaign: monthly, agenda: [], spotlights, rows: monthlyRows },
    { campaign: weekly, agenda: [], spotlights: [], rows: weeklyRows },
  ]
}

function row(
  campaignId: string,
  section: string,
  sort_order: number,
  fields: Partial<EventRow>,
): EventRow {
  return {
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    sort_order,
    section,
    title: '',
    title_url: '',
    col_a: '',
    col_b: '',
    col_c: '',
    col_d: '',
    col_e: '',
    col_f: '',
    col_g: '',
    highlight: '',
    ...fields,
  }
}

export const NEWSLETTER_SEED_ID = '0f6c2d1a-6a0a-4d2e-9c2b-0000000000d4'

/** A worked example of the Newsletter studio: banner, rich text body, footer. */
export function newsletterSeed(): CampaignBundle {
  const forest = THEMES[0]
  const design: NewsletterDesign = {
    ...defaultDesign(),
    banner: {
      layout: 'band',
      align: 'left',
      background: forest.banner,
      text: forest.bannerText,
      showMark: true,
      logo: '',
      rightLogo: '',
      dateLabel: 'November 2026',
      imageAlt: '',
      logoBar: false,
    },
    blocks: [
      {
        id: id(),
        kind: 'text',
        html: '<p>Hi all,</p><p>Welcome to this month’s <strong>Partner Skilling Newsletter</strong>. Below you’ll find the highlights from across the program, the sessions coming up, and one ask for your partner conversations this month.</p>',
      },
      {
        id: id(),
        kind: 'text',
        html: '<h2>Highlights this month</h2><ul><li><strong>New AI learning paths</strong> are live for sales, pre-sales, and technical roles.</li><li><strong>Designation readiness</strong> sessions now run in every region, with captions in local languages.</li><li><strong>Partner success stories</strong>: share yours with us so we can feature it in a future edition.</li></ul>',
      },
      {
        id: id(),
        kind: 'callout',
        background: '#EBF3EF',
        showRule: true,
        rule: '',
        text: '',
        html: '<p><strong>Action:</strong> Share the skilling calendar with your partners and encourage them to <span style="background-color:#FFF4CE">register early</span>, as sessions fill quickly.</p>',
      },
      { id: id(), kind: 'button', label: 'Explore Microsoft Learn', url: 'https://learn.microsoft.com/training/', align: 'left', color: '' },
      { id: id(), kind: 'divider' },
      {
        id: id(),
        kind: 'text',
        html: '<h2>Upcoming sessions</h2><ol><li>Build What’s Next with Partner Skilling (regional series)</li><li>AI Workforce enablement office hours</li><li>Technical deep dives for delivery teams</li></ol><p>Find the full schedule on <a href="https://partner.microsoft.com">Microsoft Partner Center</a>.</p>',
      },
      {
        id: id(),
        kind: 'text',
        html: '<p>Thanks for everything you do for our partners.</p><p>Best regards,<br><strong>Partner Skilling team</strong></p>',
      },
    ],
    footer: {
      background: forest.footer,
      text: forest.footerText,
      html: '<p>You are receiving this email because you are part of the Microsoft Partner Skilling community.</p>',
      links: [
        { id: id(), label: 'Privacy Statement', url: PRIVACY_URL },
        { id: id(), label: 'Microsoft Partner Center', url: 'https://partner.microsoft.com' },
      ],
      showMark: true,
      logo: '',
      legal: `© ${new Date().getFullYear()} Microsoft Corporation. All rights reserved.\nMicrosoft Corporation, One Microsoft Way, Redmond, WA 98052 USA`,
    },
  }
  const base = emptyCampaign('newsletter')
  return {
    campaign: {
      ...base,
      id: NEWSLETTER_SEED_ID,
      name: 'Partner Skilling Newsletter · Nov 2026',
      subject: 'Partner Skilling Newsletter | November 2026',
      kicker: 'Microsoft Partner Skilling',
      title: 'Partner Skilling Newsletter',
      subtitle: 'What’s new in AI skilling, programs, and events this month',
      register_label: '',
      register_url: '',
      newsletter: writeDesign(design),
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}
