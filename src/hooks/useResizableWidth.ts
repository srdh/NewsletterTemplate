import { useCallback, useRef, useState } from 'react'

/**
 * A panel width you can drag-resize with a handle on one of its edges, or
 * nudge with the arrow keys once the handle has focus.
 * `edge: 'end'` puts the handle on the panel's trailing edge (dragging right
 * grows it); `edge: 'start'` puts it on the leading edge, for a panel docked
 * on the right of the window (dragging left grows it).
 */
export function useResizableWidth(
  initial: number,
  min: number,
  max: number,
  edge: 'start' | 'end' = 'end',
) {
  const [width, setWidth] = useState(initial)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)
  const sign = edge === 'end' ? 1 : -1

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragState.current = { startX: event.clientX, startWidth: width }
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)

      function onMove(moveEvent: PointerEvent) {
        if (!dragState.current) return
        const delta = (moveEvent.clientX - dragState.current.startX) * sign
        const next = Math.min(max, Math.max(min, dragState.current.startWidth + delta))
        setWidth(next)
      }

      function onUp() {
        dragState.current = null
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [width, min, max, sign],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? 48 : 16
      let delta = 0
      if (event.key === 'ArrowRight') delta = step * sign
      else if (event.key === 'ArrowLeft') delta = -step * sign
      else if (event.key === 'Home') {
        event.preventDefault()
        setWidth(min)
        return
      } else if (event.key === 'End') {
        event.preventDefault()
        setWidth(max)
        return
      } else return
      event.preventDefault()
      setWidth((current) => Math.min(max, Math.max(min, current + delta)))
    },
    [min, max, sign],
  )

  /** Spread onto the handle element: role, focus, value and both handlers. */
  const handleProps = (label: string) => ({
    role: 'separator' as const,
    tabIndex: 0,
    'aria-orientation': 'vertical' as const,
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': Math.round(width),
    onPointerDown,
    onKeyDown,
  })

  return { width, onPointerDown, onKeyDown, handleProps }
}
