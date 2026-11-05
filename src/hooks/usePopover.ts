import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Open state for a menu or picker anchored to a trigger. Closes on an outside
 * pointer press or Escape, and returns focus to the trigger on Escape.
 */
export function usePopover<T extends HTMLElement = HTMLButtonElement>() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<T>(null)

  const close = useCallback((refocus = false) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close(true)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  return { open, setOpen, close, root, trigger }
}

/** Arrow-key movement between the menu items inside a container. */
export function moveMenuFocus(event: React.KeyboardEvent<HTMLElement>) {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
  )
  if (!items.length) return
  event.preventDefault()
  const index = items.indexOf(document.activeElement as HTMLElement)
  let next = 0
  if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length
  if (event.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1
  if (event.key === 'End') next = items.length - 1
  items[next]?.focus()
}
