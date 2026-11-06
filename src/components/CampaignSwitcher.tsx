import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { moveMenuFocus, usePopover } from '../hooks/usePopover'
import type { Campaign, MasterType } from '../types'
import { MASTER_LABEL } from '../types'
import { IconCheck, IconChevron, IconDuplicate, IconMore, IconSearch, IconTrash } from './Icons'

const MASTERS: MasterType[] = ['event_invite', 'monthly_update', 'weekly_snapshot', 'newsletter', 'custom2']

/**
 * The campaign you are working on, as a picker: search, and campaigns grouped
 * by email type. New emails start from the panel on the left.
 */
export function CampaignSwitcher({
  campaigns,
  currentId,
  onSelect,
  openSignal,
}: {
  campaigns: Campaign[]
  currentId: string | null
  onSelect: (id: string) => void
  /** Bump this number to open the list from elsewhere ("All campaigns"). */
  openSignal?: number
}) {
  const { open, setOpen, close, root, trigger } = usePopover()

  useEffect(() => {
    if (openSignal) setOpen(true)
  }, [openSignal, setOpen])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const search = useRef<HTMLInputElement>(null)
  const listId = useId()
  const current = campaigns.find((campaign) => campaign.id === currentId)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = needle
      ? campaigns.filter(
          (campaign) =>
            campaign.name.toLowerCase().includes(needle) ||
            MASTER_LABEL[campaign.master_type].toLowerCase().includes(needle),
        )
      : campaigns
    // Grouped by email type, in the order the types are listed everywhere.
    return MASTERS.flatMap((master) => matches.filter((campaign) => campaign.master_type === master))
  }, [campaigns, query])

  useEffect(() => {
    if (open) search.current?.focus()
  }, [open])

  // The highlighted row never points past the end of a shorter result list.
  const activeIndex = Math.min(active, Math.max(0, filtered.length - 1))

  function toggle() {
    if (!open) {
      // Open on the current campaign with an empty search.
      const startList = MASTERS.flatMap((master) => campaigns.filter((campaign) => campaign.master_type === master))
      setQuery('')
      setActive(Math.max(0, startList.findIndex((campaign) => campaign.id === currentId)))
    }
    setOpen(!open)
  }

  function choose(id: string) {
    close(true)
    if (id !== currentId) onSelect(id)
  }

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(Math.min(filtered.length - 1, activeIndex + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(Math.max(0, activeIndex - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const pick = filtered[activeIndex]
      if (pick) choose(pick.id)
    }
  }

  return (
    <div ref={root} className="relative min-w-0">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="ui-btn ui-btn-subtle h-8 w-full min-w-0 max-w-[22rem] justify-between gap-2 px-2.5 font-semibold"
        onClick={toggle}
      >
        <span className="sr-only">Campaign: </span>
        <span className="min-w-0 truncate">{current?.name ?? 'Choose a campaign'}</span>
        <IconChevron className={'shrink-0 text-muted transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Campaigns"
          className="ui-popover popover-in absolute top-full left-0 z-40 mt-1 flex max-h-[min(70vh,34rem)] w-[min(92vw,24rem)] flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-line p-2">
            <label className="relative block">
              <span className="sr-only">Find a campaign</span>
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted">
                <IconSearch />
              </span>
              <input
                ref={search}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                }}
                onKeyDown={onSearchKey}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={filtered[activeIndex] ? `${listId}-${filtered[activeIndex].id}` : undefined}
                placeholder="Find a campaign"
                className="ui-field pl-8"
              />
            </label>
          </div>

          <ul id={listId} role="listbox" aria-label="Campaigns" className="app-scroll min-h-0 flex-1 overflow-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-muted">No campaign matches “{query.trim()}”.</li>
            ) : null}
            {filtered.map((campaign, index) => {
              const heading =
                campaign.master_type !== filtered[index - 1]?.master_type ? MASTER_LABEL[campaign.master_type] : null
              const selected = campaign.id === currentId
              return (
                <li key={campaign.id} role="presentation">
                  {heading ? (
                    <p
                      role="presentation"
                      className="px-2.5 pt-2.5 pb-1 text-[12px] font-semibold leading-4 text-muted"
                    >
                      {heading}
                    </p>
                  ) : null}
                  <div
                    id={`${listId}-${campaign.id}`}
                    role="option"
                    aria-selected={selected}
                    data-active={index === activeIndex}
                    className="ui-menu-item items-start"
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(campaign.id)}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-forest">
                      {selected ? <IconCheck /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={'block truncate ' + (selected ? 'font-semibold' : '')}>{campaign.name}</span>
                      <span className="block text-[12px] leading-4 text-muted">{edited(campaign.updated_at)}</span>
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>

        </div>
      ) : null}
    </div>
  )
}

/** Campaign-level actions that should not sit next to everyday editing. */
export function CampaignActions({
  onDuplicate,
  onDelete,
}: {
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { open, setOpen, close, root, trigger } = usePopover()
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) first.current?.focus()
  }, [open])

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-label="Campaign actions"
        title="Campaign actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="ui-icon-btn"
        onClick={() => setOpen((value) => !value)}
      >
        <IconMore />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Campaign actions"
          onKeyDown={moveMenuFocus}
          className="ui-popover popover-in absolute top-full left-0 z-40 mt-1 w-56 p-1"
        >
          <button
            ref={first}
            type="button"
            role="menuitem"
            className="ui-menu-item"
            onClick={() => {
              close(true)
              onDuplicate()
            }}
          >
            <IconDuplicate />
            Duplicate campaign
          </button>
          <div role="separator" className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            className="ui-menu-item ui-menu-item-danger"
            onClick={() => {
              close(true)
              onDelete()
            }}
          >
            <IconTrash />
            Delete campaign
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function edited(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 'Edited earlier'
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return 'Edited just now'
  if (minutes < 60) return `Edited ${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Edited ${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `Edited ${days} day${days === 1 ? '' : 's'} ago`
  return `Edited ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}
