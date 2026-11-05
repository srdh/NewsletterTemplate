import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { renderMaster } from '../templates'
import type { CampaignBundle } from '../types'
import { sectionLabel } from '../lib/sections'

/** Narrowest frame; wider emails (like the 720px weekly snapshot) widen it. */
const EMAIL_WIDTH = 640
const EMAIL_HEIGHT = 2400
const MIN_ZOOM = 0.3
const MAX_ZOOM = 2
const GUTTER = 48

/** The block under the pointer: which form section edits it, and where it sits. */
type Hover = { anchor: string; top: number; left: number; width: number; height: number }

export function PreviewPane({
  bundle,
  onPickSection,
}: {
  bundle: CampaignBundle
  /** Click on a block of the email: jump to the form section that edits it. */
  onPickSection?: (anchor: string) => void
}) {
  const html = renderMaster(bundle, true)
  const viewport = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.65)
  const frame = useRef<HTMLIFrameElement>(null)
  // The preview is as tall as the email itself, so there is no blank page
  // below short emails. Measured each time the email finishes loading.
  const [emailHeight, setEmailHeight] = useState(EMAIL_HEIGHT)
  // Same for width: each master has its own width, so the frame is measured
  // instead of assumed. It starts narrow for each email and can only grow,
  // because scrollWidth never reports less than the frame itself.
  const [emailWidth, setEmailWidth] = useState(EMAIL_WIDTH)
  const master = bundle.campaign.master_type
  useEffect(() => {
    setEmailWidth(EMAIL_WIDTH)
  }, [bundle.campaign.id, master])

  function measure() {
    const doc = frame.current?.contentDocument
    if (!doc) return
    // scrollHeight never reports less than the frame itself, so measure the
    // content box instead: the bottom of the last element in the body.
    const body = doc.body
    if (!body) return
    const style = doc.defaultView?.getComputedStyle(body)
    const marginBottom = style ? parseFloat(style.marginBottom) || 0 : 0
    const last = body.lastElementChild
    const bottom = last ? last.getBoundingClientRect().bottom : body.getBoundingClientRect().bottom
    const height = Math.ceil(bottom + marginBottom + (doc.defaultView?.scrollY ?? 0))
    if (height > 0) setEmailHeight(height)
    const width = Math.ceil(Math.max(doc.documentElement.scrollWidth, body.scrollWidth))
    if (width > 0) setEmailWidth((current) => Math.max(current, width))
  }

  const fit = useCallback(() => {
    const node = viewport.current
    if (!node) return
    const next = Math.min(1, Math.max(MIN_ZOOM, (node.clientWidth - GUTTER) / emailWidth))
    setZoom(Number(next.toFixed(3)))
  }, [emailWidth])

  useEffect(() => {
    fit()
  }, [bundle.campaign.id, fit])

  useEffect(() => {
    const node = viewport.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => fit())
    observer.observe(node)
    return () => observer.disconnect()
  }, [fit])

  // Trackpad pinch arrives as a wheel event with ctrlKey set. Plain two-finger
  // scrolling has no modifier, so it keeps scrolling the preview as usual.
  // The listener has to sit on the scroll container (not the iframe) because
  // an <iframe> is its own document: a wheel/gesture that starts over it is
  // handled inside that document, so it never reaches a listener on the
  // iframe element itself and the browser falls back to native page zoom.
  // A transparent div stacked on top of the iframe keeps every pointer and
  // wheel event on the parent page instead.
  useEffect(() => {
    const node = viewport.current
    if (!node) return

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      setZoom((current) => {
        const next = current * Math.exp(-event.deltaY / 180)
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(next.toFixed(3))))
      })
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  const [hover, setHover] = useState<Hover | null>(null)

  /** Finds the marked block under the pointer and the box all its rows cover. */
  function blockAt(event: ReactMouseEvent<HTMLDivElement>): Hover | null {
    const doc = frame.current?.contentDocument
    if (!doc) return null
    const box = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - box.left) / zoom
    const y = (event.clientY - box.top) / zoom
    const anchor = doc.elementFromPoint(x, y)?.closest<HTMLElement>('[data-section]')?.dataset.section
    if (!anchor) return null
    let top = Infinity
    let left = Infinity
    let right = 0
    let bottom = 0
    doc.querySelectorAll<HTMLElement>(`[data-section="${anchor}"]`).forEach((node) => {
      const rect = node.getBoundingClientRect()
      top = Math.min(top, rect.top)
      left = Math.min(left, rect.left)
      right = Math.max(right, rect.right)
      bottom = Math.max(bottom, rect.bottom)
    })
    return { anchor, top: top * zoom, left: left * zoom, width: (right - left) * zoom, height: (bottom - top) * zoom }
  }

  const scaledWidth = emailWidth * zoom
  const scaledHeight = emailHeight * zoom

  const campaign = bundle.campaign
  const sender = (campaign.signer_name ?? '').trim()
  const senderEmail = (campaign.signer_email ?? '').trim()

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface">
      {/* Reading pane header: what the recipient sees above the message. */}
      <div className="shrink-0 border-b border-line px-4 pt-4 pb-3.5 sm:px-6">
        <p className="text-[12px] font-medium leading-4 text-muted">Preview</p>
        <h2 className="mt-1 line-clamp-2 text-[18px] font-semibold leading-6 tracking-[-0.01em] text-ink">
          {campaign.subject || campaign.title || 'No subject'}
        </h2>
        {sender ? (
          <div className="mt-3 flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-soft text-[12px] font-semibold text-forest"
            >
              {initials(sender)}
            </span>
            <p className="min-w-0 truncate text-[13px] leading-5">
              <span className="font-semibold text-ink">{sender}</span>
              {senderEmail ? <span className="ml-1.5 text-muted">&lt;{senderEmail}&gt;</span> : null}
            </p>
          </div>
        ) : null}
      </div>
      <div ref={viewport} className="app-scroll min-h-0 flex-1 overflow-auto bg-canvas p-3 sm:p-6">
        <div
          className="relative mx-auto"
          style={{ width: scaledWidth, height: scaledHeight }}
        >
          <iframe
            ref={frame}
            title="Email preview"
            srcDoc={html}
            onLoad={measure}
            className="block origin-top-left border border-line bg-white"
            style={{
              width: emailWidth,
              height: emailHeight,
              transform: `scale(${zoom})`,
              borderRadius: `calc(var(--r-md) / ${zoom})`,
              boxShadow: 'var(--elev-md)',
            }}
          />
          {/* Catches pinch/wheel/scroll here instead of letting them fall
              into the iframe's own document, where a pinch becomes native
              browser zoom instead of reaching our handler above. */}
          <div
            aria-hidden="true"
            className={'absolute inset-0 ' + (hover ? 'cursor-pointer' : '')}
            onMouseMove={(event) => setHover(blockAt(event))}
            onMouseLeave={() => setHover(null)}
            onClick={(event) => {
              const block = blockAt(event)
              if (block) onPickSection?.(block.anchor)
            }}
          />
          {hover ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-[2px] outline-2 outline-forest"
              style={{
                top: hover.top,
                left: hover.left,
                width: hover.width,
                height: hover.height,
                background: 'rgba(30, 77, 61, 0.06)',
              }}
            >
              <span className="absolute -top-px left-0 -translate-y-full rounded-t-[4px] bg-forest px-2 py-0.5 text-[11px] font-semibold leading-4 text-white">
                Edit {sectionLabel(master, hover.anchor)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
