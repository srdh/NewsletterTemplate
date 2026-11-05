import type { CampaignBundle } from '../types'
import { GLOBE_PNG } from '../lib/globe'
import {
  emailDocument,
  escapeHtml,
  linkHtml,
  msSquares,
  richHtml,
  sectionAttr,
} from '../lib/html'

const GREEN = '#0B4F38'
const OVERVIEW = '#E7F0C8'
const ACTION = '#D7E38A'
const FONT = "'Segoe UI',Tahoma,Arial,sans-serif"

export function renderEventInvite(bundle: CampaignBundle, preview = false): string {
  const c = bundle.campaign
  const sec = (anchor: string) => sectionAttr(preview, anchor)
  const agenda = [...bundle.agenda]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-size:15px;line-height:1.45;color:#242424;">${escapeHtml(item.text)}</li>`,
    )
    .join('')

  const inner = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:28px 16px 0;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;font-family:${FONT};">
          <tr${sec('banner')}>
            <td style="padding:0 18px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="${GREEN}" height="58" style="background:${GREEN};border-radius:18px 18px 0 0;font-size:0;line-height:0;height:58px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr${sec('banner')}>
            <td style="padding:8px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" style="padding-right:12px;">
                    <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.04em;font-weight:700;color:${GREEN};">${escapeHtml(c.kicker)}</p>
                    <h1 style="margin:0;font-size:32px;line-height:1.15;font-weight:700;color:#1b1b1b;">${escapeHtml(c.title)}</h1>
                  </td>
                  <td valign="middle" width="176" align="right"><img src="${escapeHtml(c.banner_image || GLOBE_PNG)}" width="168" alt="" style="display:block;width:168px;max-width:168px;height:auto;border:0;"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 0 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" height="10" bgcolor="#E4ED6A" style="background:#E4ED6A;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="34%" height="10" bgcolor="#3E8F55" style="background:#3E8F55;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="33%" height="10" bgcolor="${GREEN}" style="background:${GREEN};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr${sec('body')}>
            <td style="padding:8px 36px 8px;">
              <p style="margin:0 0 16px;font-size:15px;color:#242424;">${escapeHtml(c.greeting)}</p>
              ${richHtml(c.intro)}
            </td>
          </tr>
          ${
            c.section_image
              ? `<tr${sec('section1')}>
            <td style="padding:8px 20px 0;">
              <img src="${escapeHtml(c.section_image)}" width="600" alt="${escapeHtml(c.event_name || 'Event image')}" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>`
              : ''
          }
          <tr${sec('section1')}>
            <td style="padding:8px 20px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="${OVERVIEW}" style="background:${OVERVIEW};padding:28px 28px 20px;">
                    <h2 style="margin:0 0 14px;font-size:28px;line-height:1.2;font-weight:600;color:#1b1b1b;">Event overview</h2>
                    <p style="margin:0 0 6px;font-size:15px;line-height:1.5;">${linkHtml(c.event_name, c.event_url)}</p>
                    <p style="margin:0 0 4px;font-size:15px;color:#242424;"><strong>${escapeHtml(c.event_date_label)}</strong></p>
                    <p style="margin:0 0 16px;font-size:15px;color:#242424;">${escapeHtml(c.event_time_label)}</p>
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#242424;">${escapeHtml(c.language_note)}</p>
                    ${richHtml(c.overview_body)}
                    <ul style="margin:4px 0 0;padding:0 0 0 22px;">${agenda}</ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr${sec('section1')}>
            <td style="padding:0 20px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="${ACTION}" style="background:${ACTION};padding:22px 28px;">
                    <h2 style="margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:700;color:#1b1b1b;">${escapeHtml(c.action_heading)}</h2>
                    ${richHtml(c.action_body)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr${sec('footer')}>
            <td style="padding:4px 36px 28px;">
              <p style="margin:0 0 16px;font-size:15px;color:#242424;">${escapeHtml(c.signoff_thanks)}</p>
              <p style="margin:0;font-size:15px;color:#242424;"><strong>Best regards,</strong></p>
              <p style="margin:4px 0 0;font-size:15px;color:#242424;"><strong>${escapeHtml(c.signer_name)}</strong></p>
              <p style="margin:2px 0 0;font-size:13px;color:#3b3b3b;">${escapeHtml(c.signer_title)}</p>
              <p style="margin:2px 0 10px;font-size:13px;">${c.signer_email ? `<a href="mailto:${escapeHtml(c.signer_email)}" style="color:#0067C0;text-decoration:underline;">${escapeHtml(c.signer_email)}</a>` : ''}</p>
              ${msSquares(12, 2)}
            </td>
          </tr>
          <tr${sec('footer')}>
            <td bgcolor="${GREEN}" style="background:${GREEN};padding:18px 28px;color:#ffffff;font-size:11px;line-height:1.5;">
              <p style="margin:0 0 8px;">© ${new Date().getFullYear()} Microsoft Corporation. All rights reserved.</p>
              <p style="margin:0;">Microsoft Corporation · One Microsoft Way · Redmond, WA 98052</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`

  return emailDocument(c.subject || c.title, inner)
}
