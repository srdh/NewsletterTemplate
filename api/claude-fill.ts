import type { VercelRequest, VercelResponse } from '@vercel/node'

/*
 * The one place the Claude agent is defined: its instructions, the answer
 * format it must use, and the API call. The Vercel function below and the
 * local dev server (vite.claude-plugin.ts) both call runClaudeFill, so the
 * live site and `npm run dev` always behave the same.
 */

export type ChatTurn = { role: 'user' | 'assistant'; text: string }

export type FillRequest = {
  prompt: string
  history?: ChatTurn[]
  current?: unknown
}

export type FillResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string }

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const MAX_HISTORY = 12

const FIELD_KEYS = [
  'name',
  'subject',
  'region',
  'kicker',
  'title',
  'greeting',
  'intro',
  'event_name',
  'event_url',
  'event_date_label',
  'event_time_label',
  'language_note',
  'overview_body',
  'action_heading',
  'action_body',
  'register_label',
  'register_url',
  'secondary_cta_label',
  'secondary_cta_url',
  'signoff_thanks',
  'signer_name',
  'signer_title',
  'signer_email',
  'month_label',
  'subtitle',
  'contents_intro',
  'snapshot_date',
  'callouts',
] as const

const EXAMPLE_EVENT_INVITE = JSON.stringify({
  master_type: 'event_invite',
  fields: {
    name: 'ASIA · Sep 2026 · Build What’s Next',
    subject: 'Use Skilling to drive impact | Build What’s Next with Partner Skilling (ASIA)',
    kicker: 'ASIA- SEPTEMBER 2026',
    title: 'Build What’s Next with Partner Skilling',
    greeting: 'Hi all,',
    intro:
      'We’re excited to announce the upcoming [Build What’s Next with Partner Skilling session for ASIA](https://aka.ms/BuildWhatsNextASIA). This is an informational series that helps partners turn AI opportunities into revenue, accelerate technical intensity, and drive faster business impact.\n\nThis is the perfect opportunity for partners to get a first look at what’s new, what’s coming, and how to take advantage of the latest Partner Skilling initiatives, programs, and resources available this year.',
    event_name: 'Build What’s Next with Partner Skilling for ASIA – September 2026',
    event_url: 'https://aka.ms/BuildWhatsNextASIA',
    event_date_label: 'Tuesday, September 8, 2026',
    event_time_label: '9:00 AM – 10:15 AM (India Standard Time)',
    language_note:
      'This event will be delivered in English. Multi-language closed captioning will be available for 简体中文, 繁體中文, 日本語, and 한국어.',
    overview_body:
      'Microsoft Partner Skilling helps partners build the sales, pre-sales, and technical delivery capabilities needed to accelerate customer value, strengthen execution, and unlock new AI and cloud opportunities. We will highlight all the programs and resources available to partners to skill up, earn designations, and build what’s next. This new September 2026 session will cover:',
    action_heading: 'ACTION: Invite your partners to this event',
    action_body:
      'We’d love your help to invite partners to this event. Please use the attached localized emails we’ve prepared to send directly to your partners. All internal team members can also [Register here](https://aka.ms/BuildWhatsNextASIA).',
    signoff_thanks: 'Thank you for helping your partners build what’s next.',
    signer_name: 'Priya Menon',
    signer_title: 'Asia Partner Skilling Strategy Lead',
    signer_email: 'priya.menon@example.com',
  },
  agenda: [
    'Welcome & Key Takeaways',
    'FY27 Strategy Overview',
    'FY27 Initiatives & Priorities',
    'Partner Skilling Content Priorities',
    'Platform Updates',
    'Organizational Skilling',
    'Hackathons',
  ],
})

export const AGENT_INSTRUCTIONS = `You are the Copilot agent inside Newsletter Studio. Strat1 consultants use this studio to build Microsoft Partner Skilling Outlook emails for Partner Skilling Leads. You help the person write and edit ONE email: the one given to you as "Current email".

# How you work
- You change the email only by calling the update_email tool. The person sees your proposed changes, then clicks Apply or Discard. Nothing changes until they apply.
- Always read the current email first and build on it. Edit what is there. Do not rewrite fields the person did not ask about.
- Only include fields you are changing. Leave every other field out.
- Use the conversation so far. "Make it shorter" or "change the date" refers to the email and to what you did before.

# Never invent specifics (most important rule)
- Do not make up dates, times, time zones, names, job titles, email addresses, URLs, prices, owners, or project facts that the person has not given you and that are not already in the current email.
- Never assume. Do not fill a value and then say "assuming ..." or "please confirm". If you do not know it, leave that field unchanged and ask.
- Do not create or edit links for a new region, event, or month by guessing (for example turning .../BuildWhatsNextASIA into .../BuildWhatsNextEMEA). Keep the existing link unchanged and ask for the right one.
- Never write placeholders such as [DATE], [SENDER NAME], [Link], TBD, XX, or "Week of [DATE]". If something is missing, leave that field out and ask for it in your reply.
- Exception, only when the person explicitly asks for placeholder, mock, sample, or dummy details: fill clearly fake but realistic values, such as the name "Jane Doe", the title "EMEA Partner Skilling Lead", the email jane.doe@example.com, or the link https://example.com/register. Use only example.com addresses and links for these. Say in your reply that they are placeholders to replace before sending. Still never use bracket placeholders like [NAME].
- Example. Request: "Make this the EMEA version on October 14." You know the region and the date, not the time, time zone, or the EMEA registration link. Change the region, kicker, subject, event name, and date text. Leave the time and every link unchanged. Reply: "I switched the invite to EMEA on Wednesday, October 14, 2026. What time and time zone should it show, and what is the EMEA registration link?"
- You may write general Partner Skilling copy yourself: intros, overview paragraphs, calls to action, agenda topic wording, callout phrasing.
- Links: only use a URL the person gave you or one already in the email. In body text, write a link as [visible text](https://...).

# Voice
Microsoft Partner Skilling voice: clear, warm, professional, US English, concise, no hype, no emoji. Match the example email's tone and length. Plain text only, never HTML.

# Your reply (the "reply" field)
- One to three short sentences, written to the person in plain language.
- Say what you changed in human terms, and ask for anything you still need in one short question (for example "What date, time, and time zone should the invite show?").
- Do not list every field; the studio already shows the field-by-field changes.
- If you only need to ask a question, send the reply with no other changes.
- If the request is not about this email, say briefly what you can help with and change nothing.

# Templates (master_type)
Only set master_type when the person clearly wants a different kind of email. When you switch, fill the fields that template uses; the studio clears fields the new template does not use.

## newsletter: Newsletter studio (free-form newsletter)
The person designs the banner style, the body (rich text blocks, callouts, images, buttons), and the footer by hand in the form. You can only fill the subject and the banner text:
- name, subject.
- kicker: small line above the banner headline, e.g. "Microsoft Partner Skilling".
- title: banner headline. subtitle: one line under it.
- register_label and register_url: optional button in the banner. Only set register_url when given a real link.
If asked to write or change the body or footer of a newsletter, say in one sentence that you can draft the subject and banner, and that the body and footer are edited in the form with the rich text toolbar.

## event_invite: "Build What's Next with Partner Skilling" regional event invite
Layout, in the brief's own words: Banner (kicker, title), Body (greeting, intro), Section-1 (event overview with agenda, then the action block), Footer (MS Signature). Use these names when you talk about parts of the email.
- name: the campaign's name in the studio list, not shown in the email. Pattern: "REGION · Mon YYYY · Build What’s Next".
- subject: the email subject line.
- kicker: small line above the banner title, e.g. "ASIA- SEPTEMBER 2026".
- title: banner headline, normally "Build What’s Next with Partner Skilling".
- region: region label for the studio, e.g. ASIA, EMEA, Americas.
- greeting: e.g. "Hi all,".
- intro: one or two short paragraphs announcing the session; may link the session name.
- event_name: linked event title in the overview box. event_url: its registration link.
- event_date_label: e.g. "Tuesday, September 8, 2026". event_time_label: e.g. "9:00 AM – 10:15 AM (India Standard Time)".
- language_note: delivery language and captioning.
- overview_body: one paragraph that leads into the agenda list, ending with something like "This session will cover:".
- agenda: list of short session topics (a few words each).
- action_heading: e.g. "ACTION: Invite your partners to this event". action_body: what the internal team should do, may include a registration link.
- signoff_thanks, signer_name, signer_title, signer_email: the Microsoft signature.
- Images (the banner art and the optional Section-1 image) are uploaded by the person with "Add image" in the form. You cannot add, change, or describe them. If asked for an image, say so in one sentence and point them to Add image.

## monthly_update: Partner Skilling Update newsletter
- name, subject, month_label (e.g. "October 2026"), subtitle (banner subtitle), intro, action_body (shown under "Call to Action"), signer_name, signer_title.
- contents_intro: footer small print; leave out unless asked.
- spotlights: cards of {headline, image_url, body, bullets, cta_label, cta_url}. bullets are one per line without dashes. cta_label defaults to "Register now!". Only set image_url or cta_url when given a real link.
- rows, section "virtual_skilling": title = event name, title_url = event link, col_a = focus, col_b = date and time.
- rows, section "on_demand": title = learning journey, title_url = link, col_a = focus, col_b = link text or access note.

## weekly_snapshot: internal weekly project status email
- name, subject, snapshot_date (e.g. "Week of August 11, 2026"), greeting, intro.
- callouts: one callout per line, each line starting with "- ".
- overview_body: one sentence shown between the new requests table and the work in progress table.
- action_body: text under "Working with Delightful". register_label and register_url: first button. secondary_cta_label and secondary_cta_url: second button.
- rows, section "new_requests": col_a = Owner, title = Initiative, col_b = Request date, col_c = Target due date, col_d = Current status, col_e = Project quote, col_f = Project approval, col_g = Budget tracking.
- rows, section "work_in_progress": col_a = Owner, title = Initiative, col_b = Planned delivery, col_c = Current status, col_d = Project quote, col_g = Budget tracking.
- rows, section "completed": col_a = Owner, title = Initiative, col_b = Delivered date, col_c = Notes on scope changes, col_d = Final price, col_g = Budget tracking.
- Each row is one real project. Never put column names in cells. highlight is "yellow", "green", "orange", or "" to flag a row.

# Lists
- agenda and spotlights: when you include one, send the complete list as it should end up. It replaces the old list.
- rows: for each table section you include, send every row that section should end up with. Sections you leave out stay as they are.

# Example of a finished event_invite
${EXAMPLE_EVENT_INVITE}`

const TEXT = { type: 'string' } as const

const UPDATE_EMAIL_TOOL = {
  name: 'update_email',
  description:
    'Propose changes to the current email and reply to the person. Include only what changes. The person reviews and applies.',
  input_schema: {
    type: 'object',
    properties: {
      reply: {
        type: 'string',
        description:
          'One to three short sentences to the person: what you changed, and any question about missing details.',
      },
      master_type: {
        type: 'string',
        enum: ['newsletter', 'event_invite', 'monthly_update', 'weekly_snapshot'],
        description: 'Only when switching to a different kind of email.',
      },
      fields: {
        type: 'object',
        description: 'Text fields to change. Leave out anything unchanged.',
        properties: Object.fromEntries(FIELD_KEYS.map((key) => [key, TEXT])),
        additionalProperties: false,
      },
      agenda: {
        type: 'array',
        description: 'Complete agenda list (replaces the old one).',
        items: TEXT,
      },
      spotlights: {
        type: 'array',
        description: 'Complete spotlight card list (replaces the old one).',
        items: {
          type: 'object',
          properties: {
            headline: TEXT,
            image_url: TEXT,
            body: TEXT,
            bullets: TEXT,
            cta_label: TEXT,
            cta_url: TEXT,
          },
          required: ['headline'],
        },
      },
      rows: {
        type: 'array',
        description: 'Every row for each table section you change.',
        items: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              enum: ['virtual_skilling', 'on_demand', 'new_requests', 'work_in_progress', 'completed'],
            },
            title: TEXT,
            title_url: TEXT,
            col_a: TEXT,
            col_b: TEXT,
            col_c: TEXT,
            col_d: TEXT,
            col_e: TEXT,
            col_f: TEXT,
            col_g: TEXT,
            highlight: { type: 'string', enum: ['', 'yellow', 'green', 'orange'] },
          },
          required: ['section', 'title'],
        },
      },
    },
    required: ['reply'],
  },
}

type AnthropicMessage = {
  content?: Array<{ type?: string; text?: string; name?: string; input?: unknown }>
  error?: { message?: string }
}

type ApiMessage = { role: 'user' | 'assistant'; content: string }

/** The API needs alternating turns starting with the person. */
function buildMessages(request: FillRequest): ApiMessage[] {
  const turns = (Array.isArray(request.history) ? request.history : [])
    .filter(
      (turn): turn is ChatTurn =>
        Boolean(turn) &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.text === 'string' &&
        turn.text.trim().length > 0,
    )
    .slice(-MAX_HISTORY)

  const messages: ApiMessage[] = []
  for (const turn of turns) {
    const last = messages[messages.length - 1]
    if (last && last.role === turn.role) last.content += `\n\n${turn.text.trim()}`
    else messages.push({ role: turn.role, content: turn.text.trim() })
  }
  while (messages[0] && messages[0].role !== 'user') messages.shift()

  const current =
    request.current === undefined ? '(not provided)' : JSON.stringify(request.current)
  const finalTurn = `Current email:\n${current}\n\nRequest:\n${request.prompt}`

  const last = messages[messages.length - 1]
  if (last && last.role === 'user') last.content += `\n\n${finalTurn}`
  else messages.push({ role: 'user', content: finalTurn })
  return messages
}

export async function runClaudeFill(
  request: FillRequest,
  apiKey: string | undefined,
  modelSetting: string | undefined,
): Promise<FillResult> {
  const prompt = typeof request.prompt === 'string' ? request.prompt.trim() : ''
  if (!prompt) return { ok: false, status: 400, error: 'Prompt is empty.' }

  const key = apiKey?.trim()
  if (!key) {
    return {
      ok: false,
      status: 503,
      error: 'ANTHROPIC_API_KEY is missing. Add it to .env locally, or where the studio is hosted (Vercel: Project Settings → Environment Variables; Cloudflare: npx wrangler secret put ANTHROPIC_API_KEY).',
    }
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelSetting?.trim() || DEFAULT_MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: AGENT_INSTRUCTIONS,
      tools: [UPDATE_EMAIL_TOOL],
      tool_choice: { type: 'tool', name: 'update_email' },
      messages: buildMessages({ ...request, prompt }),
    }),
  })

  const raw = (await upstream.json()) as AnthropicMessage
  if (!upstream.ok) {
    return {
      ok: false,
      status: upstream.status,
      error: raw.error?.message || `Claude returned ${upstream.status}.`,
    }
  }

  const call = (raw.content ?? []).find(
    (block) => block.type === 'tool_use' && block.name === 'update_email',
  )
  if (!call || !call.input || typeof call.input !== 'object') {
    return { ok: false, status: 502, error: 'Claude did not return any email changes.' }
  }
  const checked = removeUnknownLinks(call.input as Record<string, unknown>, {
    ...request,
    prompt,
  })
  return { ok: true, text: JSON.stringify(checked) }
}

const URL_PATTERN = /https?:\/\/[^\s)\]"'<>]+/g

function normalizeUrl(url: string): string {
  return url.replace(/[.,;:!?]+$/, '').replace(/\/+$/, '').toLowerCase()
}

/**
 * Safety net for invented links. The agent may only use a URL the person
 * typed, one from earlier in the conversation, or one already in the email.
 * Anything else is taken out before the person sees the proposal, and the
 * reply asks for the real link instead.
 */
export function removeUnknownLinks(
  input: Record<string, unknown>,
  request: FillRequest,
): Record<string, unknown> {
  const known = new Set<string>()
  const sources = [
    request.prompt,
    JSON.stringify(request.current ?? ''),
    ...(request.history ?? []).map((turn) => turn.text),
  ]
  for (const source of sources) {
    for (const url of String(source).match(URL_PATTERN) ?? []) known.add(normalizeUrl(url))
  }
  // example.com (and .org, .net) is reserved for placeholders, so a mock link
  // the person asked for can never be mistaken for a real one.
  const isPlaceholder = (url: string) =>
    /^https?:\/\/([a-z0-9-]+\.)*example\.(com|org|net)(\/|$)/i.test(url)
  const isKnown = (url: string) => known.has(normalizeUrl(url)) || isPlaceholder(url)
  let removed = 0

  const cleanText = (value: string): string =>
    value
      // [label](unknown link) keeps the label as plain text.
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (whole, label: string, url: string) => {
        if (isKnown(url)) return whole
        removed += 1
        return label
      })
      .replace(URL_PATTERN, (url) => {
        if (isKnown(url)) return url
        removed += 1
        return ''
      })
      .replace(/[ \t]+$/gm, '')

  const cleanRecord = (record: Record<string, unknown>, dropEmptyLinks: boolean) => {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== 'string') {
        out[key] = value
        continue
      }
      const cleaned = cleanText(value)
      // A link field (event_url, cta_url, ...) that only held an unknown
      // URL is left out, so the email keeps its current link.
      if (dropEmptyLinks && cleaned.trim() === '' && value.trim() !== '') continue
      out[key] = cleaned
    }
    return out
  }

  const output: Record<string, unknown> = { ...input }
  if (input.fields && typeof input.fields === 'object') {
    output.fields = cleanRecord(input.fields as Record<string, unknown>, true)
  }
  for (const list of ['spotlights', 'rows'] as const) {
    if (Array.isArray(input[list])) {
      output[list] = (input[list] as unknown[]).map((item) =>
        item && typeof item === 'object' ? cleanRecord(item as Record<string, unknown>, false) : item,
      )
    }
  }
  if (Array.isArray(input.agenda)) {
    output.agenda = (input.agenda as unknown[]).map((item) =>
      typeof item === 'string' ? cleanText(item) : item,
    )
  }

  if (removed > 0) {
    const reply = typeof input.reply === 'string' ? input.reply.trim() : ''
    output.reply = `${reply}${reply ? ' ' : ''}I left out a link I don't have. Paste the correct link and I'll add it.`
  }
  return output
}

function readRequest(body: unknown): FillRequest {
  let value = body
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown
    } catch {
      value = {}
    }
  }
  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    prompt: typeof record.prompt === 'string' ? record.prompt : '',
    history: Array.isArray(record.history) ? (record.history as ChatTurn[]) : [],
    current: record.current,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' })
    return
  }
  try {
    const result = await runClaudeFill(
      readRequest(req.body),
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_MODEL,
    )
    if (result.ok) res.status(200).json({ text: result.text })
    else res.status(result.status).json({ error: result.error })
  } catch (caught) {
    res.status(500).json({
      error: caught instanceof Error ? caught.message : 'Claude fill failed.',
    })
  }
}
