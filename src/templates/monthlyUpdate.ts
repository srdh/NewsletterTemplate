import type { CampaignBundle, EventRow, SpotlightCard } from '../types'
import {
  emailDocument,
  escapeHtml,
  linkHtml,
  markedBlock,
  msSquares,
  richHtml,
  sectionAttr,
} from '../lib/html'

const GREEN = '#0B4F38'
const LINK = '#0067C0'

function contentsList(bundle: CampaignBundle): string {
  const items = [
    ...bundle.spotlights.map((s) => s.headline),
    'Upcoming Virtual Skilling',
    'On-Demand Skilling',
  ].filter(Boolean)
  return items
    .map(
      (item) =>
        `<p style="margin:0 0 8px;font-size:13px;line-height:1.4;"><a href="#spotlight" style="color:${LINK};text-decoration:underline;">${escapeHtml(item)}</a></p>`,
    )
    .join('')
}

function spotlightBlock(card: SpotlightCard, preview: boolean): string {
  const bullets = card.bullets
    .split('\n')
    // The email adds its own bullet points, so drop typed "- " or "• " markers.
    .map((b) => b.trim().replace(/^[-*\u2022]\s+/, ''))
    .filter(Boolean)
    .map(
      (b) =>
        `<li style="margin:0 0 6px;font-size:14px;line-height:1.45;color:#242424;">${escapeHtml(b)}</li>`,
    )
    .join('')
  const art = card.image_url
    ? `<img src="${escapeHtml(card.image_url)}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;">`
    : `<div style="height:160px;background:linear-gradient(120deg,#0B4F38,#7ED3B2);"> </div>`

  return `<tr${sectionAttr(preview, 'spotlight')}>
    <td style="padding:0 0 28px;">
      <h3 style="margin:0 0 10px;font-size:18px;line-height:1.3;color:#1b1b1b;">${escapeHtml(card.headline)}</h3>
      ${art}
      <div style="padding-top:12px;">${richHtml(card.body)}</div>
      ${bullets ? `<ul style="margin:0 0 10px;padding:0 0 0 18px;">${bullets}</ul>` : ''}
      <p style="margin:0;">${linkHtml(card.cta_label || 'Register now!', card.cta_url)}</p>
    </td>
  </tr>`
}

function tableSection(
  heading: string,
  headers: string[],
  rows: EventRow[],
  mapper: (row: EventRow) => string[],
): string {
  if (!rows.length) return ''
  const th = headers
    .map(
      (h) =>
        `<th align="left" style="padding:8px 10px;font-size:12px;font-weight:700;color:#ffffff;background:${GREEN};">${escapeHtml(h)}</th>`,
    )
    .join('')
  const body = rows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row, i) => {
      const cells = mapper(row)
      const bg = i % 2 === 0 ? '#f7f7f7' : '#ffffff'
      return `<tr>${cells
        .map(
          (cell, idx) =>
            `<td style="padding:8px 10px;font-size:13px;line-height:1.4;color:#242424;background:${bg};border-bottom:1px solid #e5e5e5;">${idx === 0 && row.title_url ? linkHtml(cell, row.title_url) : escapeHtml(cell)}</td>`,
        )
        .join('')}</tr>`
    })
    .join('')
  return `<h3 style="margin:22px 0 8px;font-size:18px;color:#1b1b1b;">${escapeHtml(heading)}</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>${th}</tr>
      ${body}
    </table>`
}

export function renderMonthlyUpdate(bundle: CampaignBundle, preview = false): string {
  const c = bundle.campaign
  const sec = (anchor: string) => sectionAttr(preview, anchor)
  const virtual = bundle.rows.filter((r) => r.section === 'virtual_skilling')
  const onDemand = bundle.rows.filter((r) => r.section === 'on_demand')
  const spotlights = [...bundle.spotlights].sort((a, b) => a.sort_order - b.sort_order)

  const inner = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
          <tr${sec('banner')}>
            <td bgcolor="${GREEN}" style="background:${GREEN};padding:18px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td valign="middle">${msSquares(10, 2)}</td>
                  <td align="right" style="color:#ffffff;font-size:12px;">${escapeHtml(c.month_label)}</td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Partner Skilling Update</p>
              <p style="margin:4px 0 0;font-size:16px;color:#d7eadf;">${escapeHtml(c.subtitle)}</p>
            </td>
          </tr>
          <tr${sec('body')}>
            <td style="padding:22px 24px 8px;">
              <table role="presentation" width="100%">
                <tr>
                  <td valign="top" style="padding-right:16px;">
                    ${richHtml(c.intro)}
                    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1b1b1b;">Call to Action</p>
                    ${richHtml(c.action_body)}
                    <p style="margin:16px 0 0;font-size:14px;color:#242424;"><strong>${escapeHtml(c.signer_name)}</strong><br>${escapeHtml(c.signer_title)}</p>
                  </td>
                  <td valign="top" width="200" bgcolor="#f4f4f4" style="background:#f4f4f4;padding:14px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1b1b1b;">Contents</p>
                    ${contentsList(bundle)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 8px;">
              <h2 id="spotlight"${sec('spotlight')} style="margin:12px 0 16px;font-size:20px;color:${GREEN};">In the Spotlight. Upcoming events you can take</h2>
              <table role="presentation" width="100%">${spotlights.map((card) => spotlightBlock(card, preview)).join('')}</table>
              ${markedBlock(
                preview,
                'events',
                tableSection(
                  'Upcoming events · Virtual Skilling',
                  ['Event', 'Focus', 'Date and time'],
                  virtual,
                  (r) => [r.title, r.col_a, r.col_b],
                ),
              )}
              ${markedBlock(
                preview,
                'events',
                tableSection(
                  'On-Demand Skilling',
                  ['Learning journey', 'Focus', 'Link'],
                  onDemand,
                  (r) => [r.title, r.col_a, r.col_b],
                ),
              )}
            </td>
          </tr>
          <tr${sec('signature')}>
            <td bgcolor="${GREEN}" style="background:${GREEN};padding:18px 24px;color:#ffffff;font-size:11px;line-height:1.5;">
              <p style="margin:0 0 8px;">${escapeHtml(c.contents_intro || 'Let us know if you prefer that we send you these communications. To learn how to manage your contact preferences, see our privacy statement.')}</p>
              <p style="margin:0;">© ${new Date().getFullYear()} Microsoft Corporation. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`

  return emailDocument(c.subject || c.title, inner)
}
