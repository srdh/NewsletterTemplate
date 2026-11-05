# Publish the studio on Cloudflare

Newsletter Studio runs on Cloudflare as one **Worker with static assets**:

- the built app (`dist/`) is served as static files, and any unknown path loads the studio;
- `/api/claude-fill` (the Copilot agent) runs in the Worker with your `ANTHROPIC_API_KEY` secret, so the key never reaches the browser.

The pieces are already in the repo: `wrangler.jsonc` (config), `worker/index.ts` (the Worker), and the `deploy:cloudflare` script in `package.json`. Vercel still works as before; `vercel.json` and `api/claude-fill.ts` are untouched in how they deploy.

You need a free Cloudflare account and Node.js 20 or later.

---

## Option A: deploy from your laptop (quickest)

Run these in the project folder (`oft-template-maker`), in PowerShell or a terminal.

1. **Install packages** (once):

   ```bash
   npm install
   ```

2. **Sign in to Cloudflare** (opens the browser once):

   ```bash
   npx wrangler login
   ```

3. **Check your `.env`.** Anything starting with `VITE_` (Supabase URL and anon key, Copilot Studio token endpoint) is baked into the app at build time, so set it in `.env` before you deploy. Leave them empty to keep the browser-only tables.

4. **Build and deploy:**

   ```bash
   npm run deploy:cloudflare
   ```

   The first run creates a Worker called `newsletter-template-studio` and prints its address, like `https://newsletter-template-studio.<your-subdomain>.workers.dev`.

5. **Add the Claude key** as a secret (paste the key when asked):

   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

   Optional, to pick a different model:

   ```bash
   npx wrangler secret put ANTHROPIC_MODEL
   ```

6. **Open the address** from step 4. Ask Copilot to fill an email to check the key works, then try **Download .oft**.

To publish changes later, run `npm run deploy:cloudflare` again. Secrets stay in place.

---

## Option B: deploy automatically from GitHub

Every push to `main` rebuilds and publishes the studio.

1. Push the project to a GitHub repository (`.env` stays out of git).
2. In the Cloudflare dashboard, go to **Workers & Pages** → **Create** → import your Git repository, and pick the repo and the `main` branch.
3. Name the Worker **`newsletter-template-studio`** (the same `name` as in `wrangler.jsonc`).
4. Build settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (the default)
   - **Root directory:** leave empty, or set it to the folder with `package.json` if the repo holds more than the studio.
5. Under **Build variables and secrets**, add any `VITE_` values you use (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_COPILOT_TOKEN_ENDPOINT`). They are needed at build time only.
6. Deploy. After the first build, open the Worker → **Settings** → **Variables & Secrets** → **Add**, choose **Secret**, and add `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL` as a plain variable).
7. Open the `workers.dev` address shown on the Worker's page.

---

## Optional extras

- **Your own domain:** Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** (the domain must be on your Cloudflare account).
- **Limit who can open it:** put the Worker behind **Cloudflare Access** (Zero Trust) so only your team's email addresses can sign in. The studio has no sign-in of its own, so do this before sharing the address widely.
- **Try the Worker locally:** put `ANTHROPIC_API_KEY=...` in a file named `.dev.vars` (ignored by git), run `npm run build`, then `npx wrangler dev`.
- **Logs:** Worker → **Observability** shows requests and errors from `/api/claude-fill` (`"observability"` is on in `wrangler.jsonc`).

## If something goes wrong

| What you see | What to do |
| --- | --- |
| Copilot says `ANTHROPIC_API_KEY is missing` | Add the secret (Option A step 5, or Option B step 6). No redeploy needed. |
| The studio loads but shows the sample campaigns instead of Supabase data | The `VITE_SUPABASE_*` values were not set when it was built. Set them (`.env` or build variables) and deploy again. |
| `Authentication error` from Wrangler | Run `npx wrangler login` again, or check you picked the right Cloudflare account. |
| GitHub build fails on the Worker name | Make the dashboard Worker name match `"name"` in `wrangler.jsonc`. |
