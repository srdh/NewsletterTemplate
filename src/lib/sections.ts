import type { MasterType } from '../types'

// Short tab names for the section jump strip, in the order sections appear.
export const SECTION_TABS: Record<MasterType, [anchor: string, label: string][]> = {
  // Custom 2 edits blocks one at a time (OutlineFields), without tabs.
  custom2: [['campaign', 'Campaign']],
  hackathon: [['campaign', 'Campaign']],
  newsletter: [
    ['campaign', 'Campaign'],
    ['style', 'Style'],
    ['banner', 'Banner'],
    ['body', 'Body'],
    ['footer', 'Footer'],
  ],
  // Matches the brief: Banner, Body, Event details, Footer.
  event_invite: [
    ['campaign', 'Campaign'],
    ['banner', 'Banner'],
    ['body', 'Body'],
    ['section1', 'Event details'],
    ['footer', 'Footer'],
  ],
  monthly_update: [
    ['campaign', 'Campaign'],
    ['banner', 'Banner'],
    ['body', 'Body'],
    ['spotlight', 'Spotlight'],
    ['events', 'Events'],
    ['signature', 'Signature'],
  ],
  weekly_snapshot: [
    ['campaign', 'Campaign'],
    ['header', 'Header'],
    ['tables', 'Tables'],
    ['footer', 'Footer'],
  ],
}

/** Name of a form section, for the preview's "Edit …" label. */
export function sectionLabel(master: MasterType, anchor: string): string {
  return SECTION_TABS[master].find(([id]) => id === anchor)?.[1] ?? 'this section'
}
