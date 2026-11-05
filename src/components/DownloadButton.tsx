import { useEffect, useRef } from 'react'
import { moveMenuFocus, usePopover } from '../hooks/usePopover'
import { IconChevron, IconDownload } from './Icons'

/**
 * Fluent split button. "Download .oft" is the main action; the arrow opens
 * the .eml option for Mac Outlook and other email apps that cannot open .oft.
 */
export function DownloadButton({
  onOft,
  onEml,
  menuAbove = false,
  compact = false,
}: {
  onOft: () => void
  onEml: () => void
  /** Phone dock sits at the bottom of the screen, so its menu opens upward. */
  menuAbove?: boolean
  /** Phone dock: shorter label. */
  compact?: boolean
}) {
  const { open, setOpen, close, root, trigger } = usePopover()
  const firstItem = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) firstItem.current?.focus()
  }, [open])

  return (
    <div ref={root} className="relative flex shrink-0 items-stretch">
      <button
        type="button"
        title="Outlook template file. Double-click it to open in classic Outlook for Windows."
        className="ui-btn ui-btn-ghost rounded-r-none"
        onClick={onOft}
      >
        <IconDownload />
        <span className="flex flex-col items-start">
          <span>{compact ? '.oft' : 'Download .oft'}</span>
          {/* Wide screens only; the phone dock uses the compact label. */}
          {compact ? null : (
            <span className="hidden text-[11px] font-normal leading-4 text-muted xl:block">
              Outlook template file
            </span>
          )}
        </span>
      </button>
      <button
        ref={trigger}
        type="button"
        aria-label="More download options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="ui-btn ui-btn-ghost rounded-l-none border-l-0 px-1.5"
        onClick={() => setOpen((value) => !value)}
      >
        <IconChevron
          className={'transition-transform ' + (open === menuAbove ? 'rotate-0' : 'rotate-180')}
        />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Download options"
          onKeyDown={moveMenuFocus}
          className={
            'ui-popover popover-in absolute right-0 z-40 w-80 p-1 ' +
            (menuAbove ? 'bottom-full mb-1' : 'top-full mt-1')
          }
        >
          <button
            ref={firstItem}
            type="button"
            role="menuitem"
            className="ui-menu-item items-start"
            onClick={() => {
              close(true)
              onOft()
            }}
          >
            <span className="mt-0.5 text-muted">
              <IconDownload />
            </span>
            <span>
              <span className="block">Outlook template (.oft)</span>
              <span className="block text-[12px] leading-4 text-muted">Classic Outlook for Windows</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="ui-menu-item items-start"
            onClick={() => {
              close(true)
              onEml()
            }}
          >
            <span className="mt-0.5 text-muted">
              <IconDownload />
            </span>
            <span>
              <span className="block">Email draft (.eml)</span>
              <span className="block text-[12px] leading-4 text-muted">Outlook for Mac, new Outlook, other mail apps</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
