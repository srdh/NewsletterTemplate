import { loadEnv, type Plugin } from 'vite'
import { runClaudeFill, type FillRequest } from './api/claude-fill.ts'

/**
 * Dev-only bridge: the browser posts to /api/claude-fill, and this runs the
 * same runClaudeFill the Vercel function uses, with ANTHROPIC_API_KEY from
 * .env, so the key never ships to the client and local matches live.
 */
export function claudeFillPlugin(): Plugin {
  return {
    name: 'oft-claude-fill',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/claude-fill' || req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await readBody(req)
          const env = loadEnv(server.config.mode, server.config.envDir, '')
          const result = await runClaudeFill(body, env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL)
          if (result.ok) sendJson(res, 200, { text: result.text })
          else sendJson(res, result.status, { error: result.error })
        } catch (caught) {
          sendJson(res, 500, {
            error: caught instanceof Error ? caught.message : 'Claude fill failed.',
          })
        }
      })
    },
  }
}

function readBody(req: import('http').IncomingMessage): Promise<FillRequest> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        const parsed = (raw ? JSON.parse(raw) : {}) as Partial<FillRequest>
        resolve({
          prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
          history: Array.isArray(parsed.history) ? parsed.history : [],
          current: parsed.current,
        })
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(
  res: import('http').ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}
