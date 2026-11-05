import type { CampaignBundle, EventRow } from '../types'
import { emailDocument, escapeHtml, markedBlock, msSquares, richHtml, sectionAttr } from '../lib/html'

const HEADERS: Record<string, { title: string; color: string; cols: string[] }> = {
  new_requests: {
    title: "This week's new requests",
    color: '#0B4F38',
    cols: [
      'Owner',
      'Initiative',
      'Request date',
      'Target due date',
      'Current status',
      'Project quote',
      'Project approval',
      'Budget tracking',
    ],
  },
  work_in_progress: {
    title: 'Work in progress',
    color: '#5B7C99',
    cols: [
      'Owner',
      'Initiative',
      'Planned delivery',
      'Current status',
      'Project quote',
      'Budget tracking',
    ],
  },
  completed: {
    title: 'August completed projects',
    color: '#1F6F73',
    cols: [
      'Owner',
      'Initiative',
      'Delivered date',
      'Notes on scope changes',
      'Final price',
      'Budget tracking',
    ],
  },
}

function tone(highlight: string): string {
  if (highlight === 'yellow') return '#FFF3B0'
  if (highlight === 'green') return '#D8E8C8'
  if (highlight === 'orange') return '#F4C7A5'
  return 'transparent'
}

function cellsFor(section: string, row: EventRow): string[] {
  if (section === 'new_requests') {
    return [
      row.col_a,
      row.title,
      row.col_b,
      row.col_c,
      row.col_d,
      row.col_e,
      row.col_f,
      row.col_g,
    ]
  }
  if (section === 'work_in_progress') {
    return [row.col_a, row.title, row.col_b, row.col_c, row.col_d, row.col_g]
  }
  return [row.col_a, row.title, row.col_b, row.col_c, row.col_d, row.col_g]
}

function renderTable(section: string, rows: EventRow[]): string {
  const meta = HEADERS[section]
  if (!meta || !rows.length) return ''
  const th = meta.cols
    .map(
      (h) =>
        `<th align="left" style="padding:8px 8px;font-size:11px;font-weight:700;color:#ffffff;background:${meta.color};">${escapeHtml(h)}</th>`,
    )
    .join('')
  const body = [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => {
      const bg = tone(row.highlight)
      return `<tr>${cellsFor(section, row)
        .map(
          (cell) =>
            `<td style="padding:8px;font-size:12px;line-height:1.35;color:#242424;background:${bg};border-bottom:1px solid #e5e5e5;vertical-align:top;">${escapeHtml(cell)}</td>`,
        )
        .join('')}</tr>`
    })
    .join('')
  return `<h2 style="margin:22px 0 6px;font-size:20px;color:#1b1b1b;">${escapeHtml(meta.title)}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>${th}</tr>
      ${body}
    </table>`
}

export function renderWeeklySnapshot(bundle: CampaignBundle, preview = false): string {
  const c = bundle.campaign
  const table = (section: string) =>
    markedBlock(preview, 'tables', renderTable(section, bundle.rows.filter((r) => r.section === section)))
  const inner = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="width:720px;max-width:720px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
          <tr>
            <td style="padding:0 0 16px;">${msSquares(12, 2)}</td>
          </tr>
          <tr>
            <td>
              ${markedBlock(
                preview,
                'header',
                `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#1b1b1b;">Weekly project snapshot | ${escapeHtml(c.snapshot_date)}</h1>
              <p style="margin:0 0 12px;font-size:15px;color:#242424;">${escapeHtml(c.greeting)}</p>
              ${richHtml(c.intro)}
              <h2 style="margin:18px 0 8px;font-size:20px;color:#1b1b1b;">Weekly call outs</h2>
              ${richHtml(c.callouts)}`,
              )}
              ${table('new_requests')}
              <p style="margin:18px 0 0;font-size:15px;color:#242424;">${escapeHtml(c.overview_body)}</p>
              ${table('work_in_progress')}
              ${table('completed')}
              ${markedBlock(
                preview,
                'footer',
                `<h2 style="margin:28px 0 8px;font-size:20px;color:#1b1b1b;">Working with Delightful</h2>
              ${richHtml(c.action_body)}
              <p style="margin:16px 0 20px;">
                <a href="${escapeHtml(c.register_url)}" style="display:inline-block;background:#0B4F38;color:#ffffff;text-decoration:none;padding:10px 16px;font-size:13px;font-weight:700;margin-right:8px;">${escapeHtml(c.register_label || 'Marketing request form')}</a>
                <a href="${escapeHtml(c.secondary_cta_url)}" style="display:inline-block;background:#0B4F38;color:#ffffff;text-decoration:none;padding:10px 16px;font-size:13px;font-weight:700;">${escapeHtml(c.secondary_cta_label || 'Working with Delightful')}</a>
              </p>`,
              )}
            </td>
          </tr>
          <tr>
            <td${sectionAttr(preview, 'footer')} style="padding:18px 0;border-top:1px solid #d0d0d0;font-size:11px;color:#5a5a5a;line-height:1.5;">
              <p style="margin:0 0 8px;">Microsoft Corporation · One Microsoft Way · Redmond, WA 98052</p>
              ${msSquares(10, 2)}
              <p style="margin:10px 0 0;">© ${new Date().getFullYear()} Microsoft Corporation. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
  return emailDocument(c.subject || c.title, inner)
}
