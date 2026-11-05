import { agentPrompt, extractJsonValue, parseAgentFill, type AgentFill } from './schema'

const USER_ID = 'oft-studio'

type Activity = {
  id?: string
  type?: string
  text?: string
  from?: { id?: string; role?: string }
  value?: unknown
}

export type FillSource = 'copilot' | 'claude' | 'sample'

export class ProviderNotConnected extends Error {
  constructor() {
    super(
      'No fill engine is connected. Paste ANTHROPIC_API_KEY into .env for the POC, or connect Copilot Studio later.',
    )
    this.name = 'ProviderNotConnected'
  }
}

/** @deprecated use ProviderNotConnected */
export class CopilotNotConnected extends ProviderNotConnected {}

export function copilotConfigured(): boolean {
  return Boolean(import.meta.env.VITE_COPILOT_TOKEN_ENDPOINT?.trim())
}

export function fillStatus(): { label: string; ready: boolean } {
  if (copilotConfigured()) return { label: 'Connected', ready: true }
  return { label: 'Connected', ready: true }
}

/** What the agent needs to know besides the new message. */
export type FillContext = {
  /** Earlier turns of this conversation, oldest first. */
  history: { role: 'user' | 'assistant'; text: string }[]
  /** The email as it is right now in the form. */
  current: unknown
}

export async function fillCampaign(
  userText: string,
  context?: FillContext,
): Promise<{ fill: AgentFill; source: FillSource }> {
  if (copilotConfigured()) {
    return { fill: await fillFromCopilot(userText), source: 'copilot' }
  }
  return { fill: await fillFromClaude(userText, context), source: 'claude' }
}

async function fillFromClaude(userText: string, context?: FillContext): Promise<AgentFill> {
  let response: Response
  try {
    response = await fetch('/api/claude-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userText,
        history: context?.history ?? [],
        current: context?.current,
      }),
    })
  } catch {
    throw new Error('Could not reach the local Claude bridge. Is npm run dev still running?')
  }

  const body = (await response.json()) as { text?: string; error?: string }
  if (response.status === 503) {
    throw new ProviderNotConnected()
  }
  if (!response.ok) {
    throw new Error(body.error || `Claude fill failed (${response.status}).`)
  }
  if (!body.text) throw new Error('Claude returned an empty reply.')

  const parsed = extractJsonValue(body.text)
  if (!parsed) {
    throw new Error(
      `Claude replied without field JSON: “${body.text.slice(0, 280)}”`,
    )
  }
  return parseAgentFill(parsed)
}

async function fillFromCopilot(userText: string): Promise<AgentFill> {
  const endpoint = import.meta.env.VITE_COPILOT_TOKEN_ENDPOINT?.trim()
  if (!endpoint) throw new ProviderNotConnected()

  const token = await requestToken(endpoint)
  const base = (
    import.meta.env.VITE_COPILOT_DIRECTLINE_BASE?.trim() ||
    'https://directline.botframework.com/v3/directline'
  ).replace(/\/$/, '')

  const started = await directLine<{ conversationId: string; token?: string }>(
    `${base}/conversations`,
    token,
    { method: 'POST' },
  )
  const auth = started.token || token
  await directLine(
    `${base}/conversations/${encodeURIComponent(started.conversationId)}/activities`,
    auth,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'message',
        from: { id: USER_ID },
        text: agentPrompt(userText),
      }),
    },
  )

  const seen = new Set<string>()
  let watermark = ''
  let plainReply = ''
  const deadline = Date.now() + 45_000

  while (Date.now() < deadline) {
    await wait(800)
    const query = watermark ? `?watermark=${encodeURIComponent(watermark)}` : ''
    const page = await directLine<{ activities?: Activity[]; watermark?: string }>(
      `${base}/conversations/${encodeURIComponent(started.conversationId)}/activities${query}`,
      auth,
    )
    if (page.watermark) watermark = page.watermark
    for (const activity of page.activities ?? []) {
      const key = activity.id || `${activity.type}:${activity.text ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      if (activity.from?.id === USER_ID) continue
      if (activity.from?.role && activity.from.role !== 'bot') continue
      const payload = payloadFrom(activity)
      if (!payload) {
        if (activity.text?.trim()) plainReply = activity.text.trim()
        continue
      }
      return parseAgentFill(payload)
    }
  }

  if (plainReply) {
    throw new Error(
      `Copilot replied in plain text instead of field data: “${plainReply.slice(0, 280)}”`,
    )
  }
  throw new Error(
    'Copilot did not send field data in time. Publish the agent, then try again.',
  )
}

export function sampleFill(userText: string): AgentFill {
  const brief = userText.trim() || 'Partner skilling session for the region'
  const lower = brief.toLowerCase()
  const title = clip(brief.split('\n')[0] ?? brief, 90)

  if (/(snapshot|weekly|budget|in progress)/.test(lower)) {
    return {
      master_type: 'weekly_snapshot',
      fields: {
        name: `Sample · ${title}`,
        subject: `Weekly project snapshot | ${title}`,
        title: 'Weekly project snapshot',
        greeting: 'Hi team,',
        intro: brief,
        snapshot_date: '09/21',
        callouts:
          '- This is a sample fill, not a Copilot reply.\n- Replace it by connecting Copilot Studio.',
      },
      rows: [
        {
          section: 'new_requests',
          title: title,
          title_url: '',
          col_a: 'Owner',
          col_b: '09/21/26',
          col_c: 'TBD',
          col_d: 'Waiting on scope.',
          col_e: 'To be scoped',
          col_f: 'Pending approval',
          col_g: 'In evaluation',
          highlight: 'yellow',
        },
        {
          section: 'work_in_progress',
          title: 'Sample work in progress',
          title_url: '',
          col_a: 'Owner',
          col_b: '09/30/26',
          col_c: 'Edits underway',
          col_d: '$2,500',
          col_e: '',
          col_f: '',
          col_g: 'Within 50% of budget used',
          highlight: 'green',
        },
      ],
    }
  }

  if (/(monthly|newsletter|spotlight|on-demand|on demand)/.test(lower)) {
    return {
      master_type: 'monthly_update',
      fields: {
        name: `Sample · ${title}`,
        subject: `Partner Skilling Update | ${title}`,
        title: 'Partner Skilling Update',
        subtitle: 'Sample',
        intro: brief,
        month_label: 'September 2026',
      },
      spotlights: [
        {
          headline: title,
          image_url: '',
          body: 'Sample spotlight. This did not come from Copilot.',
          bullets: '- Register your team\n- Share the journey link',
          cta_label: 'Register now!',
          cta_url: 'https://aka.ms',
        },
      ],
      rows: [
        {
          section: 'virtual_skilling',
          title,
          title_url: 'https://aka.ms',
          col_a: 'Microsoft Copilot',
          col_b: 'September 22 | 9:00 AM',
          col_c: '',
          col_d: '',
          col_e: '',
          col_f: '',
          col_g: '',
          highlight: '',
        },
      ],
    }
  }

  return {
    master_type: 'event_invite',
    fields: {
      name: `Sample · ${title}`,
      subject: `Invite | ${title}`,
      region: 'ASIA',
      kicker: 'ASIA- SEPTEMBER 2026',
      title,
      greeting: 'Hi all,',
      intro: brief,
      event_name: title,
      event_url: 'https://aka.ms',
      event_date_label: 'Tuesday, September 22, 2026',
      event_time_label: '9:00 AM – 10:15 AM (India Standard Time)',
      language_note: 'This event will be delivered in English.',
      overview_body: 'Sample overview. Connect Copilot Studio to fill this from a real prompt.',
      action_heading: 'ACTION: Invite your partners to this event',
      action_body: 'Share the registration link with your partners.',
      signoff_thanks: 'Thank you.',
      signer_name: 'Priya Menon',
      signer_title: 'Asia Partner Skilling Strategy Lead',
    },
    agenda: [
      { text: 'Welcome' },
      { text: 'What is new this month' },
      { text: 'How partners can take part' },
    ],
  }
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}…`
}

async function requestToken(endpoint: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(endpoint)
  } catch {
    throw new Error(
      'The browser could not reach Copilot Studio. Check that the agent is published and the Token Endpoint in the settings file is correct.',
    )
  }
  if (!response.ok) {
    throw new Error(`Copilot Studio refused the connection (${response.status}).`)
  }
  const body = (await response.json()) as { token?: string }
  if (!body.token) throw new Error('Copilot Studio did not return a token.')
  return body.token
}

async function directLine<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
  } catch {
    throw new Error('The browser lost the connection to Copilot Studio while waiting for a reply.')
  }
  if (!response.ok) {
    throw new Error(`Copilot Studio returned an error (${response.status}).`)
  }
  return (await response.json()) as T
}

function payloadFrom(activity: Activity): unknown | null {
  if (
    activity.type === 'event' &&
    activity.value &&
    typeof activity.value === 'object' &&
    !Array.isArray(activity.value)
  ) {
    return activity.value
  }
  if (!activity.text) return null
  return extractJsonValue(activity.text)
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
