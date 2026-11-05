import { runClaudeFill, type ChatTurn, type FillRequest } from '../api/claude-fill.ts'

/*
 * Cloudflare Worker for the studio. It serves the built app (dist/) as static
 * assets and runs the Copilot agent route, /api/claude-fill, with the
 * ANTHROPIC_API_KEY secret, so the key stays on the server exactly as on
 * Vercel and in `npm run dev`. Config: wrangler.jsonc.
 */

interface Env {
  /** The built studio (dist/), bound in wrangler.jsonc. */
  ASSETS: { fetch(request: Request): Promise<Response> }
  /** Secret: npx wrangler secret put ANTHROPIC_API_KEY */
  ANTHROPIC_API_KEY?: string
  /** Optional plain variable, e.g. claude-haiku-4-5. */
  ANTHROPIC_MODEL?: string
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function readRequest(request: Request): Promise<FillRequest> {
  let value: unknown = {}
  try {
    value = await request.json()
  } catch {
    value = {}
  }
  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    prompt: typeof record.prompt === 'string' ? record.prompt : '',
    history: Array.isArray(record.history) ? (record.history as ChatTurn[]) : [],
    current: record.current,
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/claude-fill') {
      if (request.method !== 'POST') return json(405, { error: 'Use POST.' })
      try {
        const result = await runClaudeFill(await readRequest(request), env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL)
        return result.ok ? json(200, { text: result.text }) : json(result.status, { error: result.error })
      } catch (caught) {
        return json(500, { error: caught instanceof Error ? caught.message : 'Claude fill failed.' })
      }
    }

    if (url.pathname.startsWith('/api/')) return json(404, { error: 'Not found.' })

    // Everything else is the studio itself.
    return env.ASSETS.fetch(request)
  },
}
