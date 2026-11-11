# Newsletter Studio

Template studio for Microsoft Partner Skilling Outlook emails. Pick a master, fill CMS fields, preview the mail, then download an Outlook template (`.oft`), download an `.eml` draft, or copy it straight into Outlook.

## Starting an email

The left panel opens on **What email are we building?** with three choices: **Partner Template**, **Custom 2**, and **Hackathons**. Partner Template and Hackathons expand to list their campaigns (one group open at a time).

- **Partner Template**: the Partner Skilling emails. Expand it to pick a campaign:
  - **Regional Template**: regional event invite (banner, event details, agenda, signature).
  - **Partner Skilling Update Template**: monthly newsletter with spotlight cards and skilling tables.
  - **Weekly Project Snapshot**: status email with request, progress, and delivery tables.
  - **Custom**: a free-form newsletter in the ME7 + Copilot learning paths format, fully editable (below).
- **Custom 2**: the same engine and formatting, edited **block by block**. The Fields pane lists the email's blocks (Email settings, Banner, Text, Event card, Table, Spotlight cards, Call to action, Signature, Footer), each with a thumbnail and summary. Open a block to edit it, then **All blocks** to go back. **Add block** adds any block type, right below the block you have open (or at the end from the list); **Save as template** keeps the email under **Your templates** on the left (stored in this browser) to start new emails from. Click a block in the preview to open it.

- **Hackathons**: hackathon emails in the Custom 2 block editor. Expand it to pick a campaign: **Register Today** (an invitation generalized from the Microsoft Insight Forge Hackathon invite: logo strip with a partner logo, banner, event dates box, Register buttons, a Light Teal Hack Prep Workshops band with workshop and self-paced course tables, and a Warm White hackathon stages band, all in the Microsoft colour palette, with the partner, event, dates, themes, and course links as `[placeholders]`), **Registration Confirmation** (rebuilt from the SoftwareOne Agentic AI Hackathon confirmation, with a Key dates table under the greeting, and the participant's name, email, temporary password, team, and role as `[placeholders]`), **FY Summary** (a year-end report generalized from the FY26 Global Partner Hackathons summary: program overview, hackathon models, number tiles, event tables, photo gallery, highlights in columns, and sponsors and leads, with year-specific content as `[placeholders]`), or **Blank hackathon email** in the same branding.

Under **Your templates**, emails you saved with **Save as template** (Custom 2). Under **Recent**, the five emails you edited last: click one to open it, or use the copy button to start a new email from it as a sample. The campaign name at the top opens a searchable list of every email. Once you chat with Copilot, **Start over** brings the templates back.

## Custom newsletters

**Custom** starts from the ME7 + Copilot learning paths layout:

- **ME7 + Copilot learning paths**: rebuilt from the “Find the right ME7 + Copilot and AI Consumption learning path for you!” Outlook template, with hero art, bordered learning-path cards, Titan badge rows, a “what’s coming next” band, and the Redmond footer. Its links are the original destinations, with Outlook Safe Links wrappers removed. Add more templates in `src/data/starters/`.

- **Style**: five themes (Partner Skilling forest, Microsoft blue, Midnight, Purple, Light), font and text size for the whole email, accent and link colours, email width (600 / 640 / 720px), the email body colour, and the background around the email.
- **Banner**: three layouts (colour band, text + image, full-width image), eyebrow, headline, subheadline, alignment, date label, Microsoft logo on/off or your own logo image, a right-side partner logo, the logo row on a white strip above the banner, banner and text colours, and an optional button.
- **Body**: a stack of blocks you can add, reorder, duplicate, fold, and delete:
  - **Text**: a rich text editor with text style (normal, heading 1–3, quote), font (Segoe UI, Aptos, Calibri, Arial, Verdana, Tahoma, Trebuchet MS, Georgia, Times New Roman, Courier New), exact font size (10–36px), bold, italic, underline, strikethrough, text colour, highlight, bulleted and numbered lists, indent, alignment, links (Ctrl+K), clear formatting, undo and redo. Pasting from Word, Outlook, or a web page keeps the formatting that works in email and drops the rest.
  - **Callout**: a shaded box for an action or note (rich text). Pick a preset or any shade colour; show, hide, or recolour the left rule (accent by default); and set the text colour (automatic picks dark or white text for the shade).
  - **Image**: uploaded picture at full body width, with alt text, optional link, and caption.
  - **Button**: a call-to-action button in the accent colour or any other colour, that renders as a solid button in classic Outlook too.
  - **Divider**: a thin line between sections.
  - **Card**: a bordered box that holds its own text, buttons, images, callouts, and dividers. **Add a card like this** puts a new empty card with the same colours right below; **Use this style for all cards** copies one card's colours to every card. New cards from **Add a block** match the last card in the email.
  - **Image + text**: a picture (badge, logo) beside rich text, in a shaded row.
  - **Colour band**: a full-width coloured section with its own text and link colours.
- **Footer**: rich text message, a row of links (privacy, unsubscribe, …), Microsoft logo on/off or your own logo image, small print, and footer colours.

Everything is rendered as table-based HTML with inline styles, so it holds up in classic Outlook for Windows (Word engine), new Outlook, Outlook for Mac, and Outlook on the web. Images travel inside the `.oft` and `.eml` files.

Copilot can draft the subject and banner text of a newsletter; the body and footer are edited by hand with the toolbar.

Code: `src/lib/newsletter.ts` (design model), `src/lib/richText.ts` (sanitizer and email styling), `src/components/RichTextEditor.tsx`, `src/components/NewsletterFields.tsx`, `src/templates/newsletter.ts`, `src/data/starters/` (ready-made templates).

**Supabase users:** re-run `supabase/schema.sql` once. It adds the `newsletter` column and allows the new `newsletter` email type.

This is **Track B**: a React studio plus tables. Inside a Microsoft tenant the same shape is Dataverse + Power Apps + Power Automate. Mapping: [docs/dataverse-map.md](docs/dataverse-map.md).

## Run locally

```bash
npm install
npm run dev
```

Without Supabase keys the same four tables live in this browser so you can demo immediately.

## Connect Supabase (the database)

1. Create a free project at [supabase.com](https://supabase.com).
2. SQL editor: run `supabase/schema.sql`.
3. Copy `.env.example` to `.env` and paste the project URL and anon key.
4. Restart `npm run dev`.

Open policies on the tables are for this POC only. Do not use them for production tenant data.

## Getting the email into Outlook

- **Download .oft**: a real Outlook template file, built in the browser. Double-click it in classic Outlook for Windows to open a ready-to-send email. Uploaded images travel inside the file.
- **Download .eml** (arrow next to Download .oft): an unsent draft for Outlook for Mac, new Outlook, and other mail apps. Images travel inside the file.
- **Copy for Outlook**: copies the designed email so you can paste it into any Outlook compose window, including Outlook on the web. Uploaded images may not survive the paste in every Outlook version; use a download when the email has images.

## Host on Cloudflare

The repo includes a Cloudflare Worker setup (`wrangler.jsonc`, `worker/index.ts`). In short: `npm install`, `npx wrangler login`, `npm run deploy:cloudflare`, then `npx wrangler secret put ANTHROPIC_API_KEY`. Full steps, including deploys from GitHub: [docs/cloudflare.md](docs/cloudflare.md).

## Host on Vercel

1. Push this repo to your own GitHub account.
2. On [vercel.com](https://vercel.com) → **Add New…** → **Project**.
3. Import **oft-template-maker**.
4. Framework: Vite. Build `npm run build`, output `dist`. Leave as detected if Vercel fills that in.
5. Before Deploy, open **Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Claude key
   - Environments: Production, Preview, Development
6. Click **Deploy**.
7. Open the `.vercel.app` URL. Ask the Copilot agent to fill an email, **Apply** its changes, then **Download .oft** or **Copy for Outlook**.

Do not add the key as `VITE_ANTHROPIC_API_KEY`. It must stay server-only as `ANTHROPIC_API_KEY`.

## Copilot agent

The agent is the chat box at the bottom of the left column. Describe the email you want and it proposes field changes. Nothing changes until you click **Apply**. After that, the reply keeps a short note of what changed, and you can still edit any field by hand.

- It sees the current email and the conversation, so follow-ups like "make the intro shorter" work.
- It asks for details it doesn't have (dates, times, names, links) instead of inventing them. Links you didn't give it are removed automatically.
- If you explicitly ask for placeholder or mock details, it uses clearly fake values on example.com.
- It can't add images. Use **Add image** in the form.
- Its instructions live in `api/claude-fill.ts` (`AGENT_INSTRUCTIONS`), shared by `npm run dev` and Vercel.

Setup:

- POC with Claude: put `ANTHROPIC_API_KEY` in `.env` (see [docs/PLAN.md](docs/PLAN.md)). Optional: `ANTHROPIC_MODEL` (default Claude Haiku 4.5).
- Later with Copilot Studio: [docs/copilot-studio-agent.md](docs/copilot-studio-agent.md).

## Templates

- Regional Template: regional event invite (`Build What’s Next`, ASIA)
- Partner Skilling Update Template: monthly newsletter
- Weekly Project Snapshot: ops status email
- Custom: free-form newsletter in the ME7 + Copilot learning paths format (banner, rich text blocks, cards, footer)
- Custom 2: block-by-block email (banner, text, heading, details, event card, table, spotlight cards, call to action, signature, footer, plus every Custom block)
- Hackathons: block-by-block hackathon emails; campaigns: Register Today, Registration Confirmation, FY Summary, Blank hackathon email

Blocks available in Custom 2 and Hackathons: text, heading (plain, filled bar, or outlined), number tiles, columns, table (up to 6 columns), details, event card, spotlight cards, photo gallery, people, call to action, signature, image, card, callout, image + text, colour band, divider.

Every colour field has a **Microsoft palette** button with the Primary (Dark Teal #225B62, Teal #49C5B1, Light Teal #B9DCD2, Warm White #FFF8F3, Pure Black #000000) and Secondary colours (light and strong Blue, Green, Purple, Violet, Yellow, Red). The text editor's colour and highlight menus use the same palette.

Any Custom 2 or Hackathons block can also have a **Background band** colour: blocks next to each other with the same colour join into one full-width band. Tables have an **open style** (no lines or fill), and a table cell written as `[link text](https://…)` becomes a link.
