import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_FONT, DEFAULT_SIZE, FONTS, FONT_SIZES, fontFromCss, fontStack } from '../lib/fonts'
import { isRichEmpty, sanitizeRichHtml, textToRichHtml } from '../lib/richText'
import { t } from '../lib/i18n'

/** The newsletter's default font and size, so the editing box matches the email. */
export const EditorLookContext = createContext<{ font: string; size: number }>({ font: DEFAULT_FONT, size: DEFAULT_SIZE })

/*
 * A small Word-style editor for email body copy. It edits real HTML in a
 * contentEditable box, and every change is passed through sanitizeRichHtml so
 * what is stored is always the Outlook-safe subset the newsletter renders.
 * The box is uncontrolled while you type (so the caret never jumps); it only
 * reloads when the value changes from outside, like switching campaigns.
 */

type Panel = null | 'link' | 'color' | 'highlight'
type BlockFormat = 'p' | 'h1' | 'h2' | 'h3' | 'blockquote'

interface ToolState {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  ul: boolean
  ol: boolean
  align: 'left' | 'center' | 'right'
  block: BlockFormat
  /** Size in px at the caret. */
  size: number
  /** Font name at the caret. */
  font: string
  link: string | null
}

const IDLE: ToolState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  align: 'left',
  block: 'p',
  size: DEFAULT_SIZE,
  font: DEFAULT_FONT,
  link: null,
}

const BLOCKS: [BlockFormat, string][] = [
  ['p', 'Normal text'],
  ['h1', 'Heading 1'],
  ['h2', 'Heading 2'],
  ['h3', 'Heading 3'],
  ['blockquote', 'Quote'],
]


/** Text colours: the strong Microsoft palette colours, plus neutrals. */
const TEXT_COLORS: [string, string][] = [
  ['#000000', 'Pure Black'],
  ['#242424', 'Black'],
  ['#616161', 'Gray'],
  ['#225B62', 'Dark Teal'],
  ['#0078D4', 'Blue'],
  ['#8661C5', 'Purple'],
  ['#C03BC4', 'Violet'],
  ['#F4364C', 'Red'],
  ['#0B4F38', 'Forest'],
  ['#107C10', 'Green'],
  ['#FFFFFF', 'White'],
]

/** Highlights: the light Microsoft palette colours, plus classic marker shades. */
const HIGHLIGHTS: [string, string][] = [
  ['#FFFF00', 'Bright yellow'],
  ['#00FFFF', 'Aqua'],
  ['#B9DCD2', 'Light Teal'],
  ['#8DC8E8', 'Light Blue'],
  ['#D4EC8E', 'Light Green'],
  ['#C5B4E3', 'Light Purple'],
  ['#D59ED7', 'Light Violet'],
  ['#FFE399', 'Light Yellow'],
  ['#FFB3BB', 'Light Red'],
  ['#FFF8F3', 'Warm White'],
]

function query(command: string): boolean {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}


function normalizeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return ''
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url
  if (/^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/.test(url)) return `mailto:${url}`
  return `https://${url}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = t("Start typing…"),
  compact = false,
  minHeight = 112,
}: {
  value: string
  onChange: (html: string) => void
  /** Accessible name for the text box. */
  label: string
  placeholder?: string
  /** Hides headings, quote, and indent (footer and callout copy). */
  compact?: boolean
  minHeight?: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const lastValue = useRef<string | null>(null)
  const saved = useRef<Range | null>(null)
  const [tools, setTools] = useState<ToolState>(IDLE)
  const [panel, setPanel] = useState<Panel>(null)
  const [focused, setFocused] = useState(false)
  const [empty, setEmpty] = useState(() => isRichEmpty(value))
  const [linkUrl, setLinkUrl] = useState('')
  const linkInput = useRef<HTMLInputElement>(null)
  const look = useContext(EditorLookContext)
  /** Size picked with nothing selected: applied to what you type next. */
  const pendingSize = useRef<number | null>(null)
  const panelId = useId()

  // Load the value into the box when it changes from outside.
  useLayoutEffect(() => {
    const node = box.current
    if (!node || value === lastValue.current) return
    node.innerHTML = value
    lastValue.current = value
    setEmpty(isRichEmpty(value))
  }, [value])

  const inBox = useCallback((target: Node | null) => {
    const node = box.current
    return Boolean(node && target && node.contains(target))
  }, [])

  const refresh = useCallback(() => {
    const selection = document.getSelection()
    const anchor = selection?.anchorNode ?? null
    if (!inBox(anchor)) return
    const element = anchor instanceof Element ? anchor : anchor?.parentElement
    const rawBlock = String(document.queryCommandValue('formatBlock') || 'p').toLowerCase()
    const block = (['h1', 'h2', 'h3', 'blockquote'].includes(rawBlock) ? rawBlock : 'p') as BlockFormat
    // What the email will show: sizes and fonts set on the text, else the
    // newsletter defaults (headings keep their own size).
    const sized = element?.closest<HTMLElement>('[style*="font-size"]')
    const px = sized && box.current?.contains(sized) ? Math.round(parseFloat(getComputedStyle(sized).fontSize)) : look.size
    const faced = element?.closest<HTMLElement>('[style*="font-family"], font[face]')
    const face =
      faced && box.current?.contains(faced)
        ? fontFromCss(faced.style.fontFamily || faced.getAttribute('face') || '') ?? look.font
        : look.font
    const link = element?.closest('a')
    setTools({
      bold: query('bold'),
      italic: query('italic'),
      underline: query('underline'),
      strike: query('strikeThrough'),
      ul: query('insertUnorderedList'),
      ol: query('insertOrderedList'),
      align: query('justifyCenter') ? 'center' : query('justifyRight') ? 'right' : 'left',
      block,
      size: px,
      font: face,
      link: link && box.current?.contains(link) ? link.getAttribute('href') : null,
    })
  }, [inBox, look.font, look.size])

  // A new default font or size (Style section) shows in the toolbar at once.
  useEffect(() => {
    setTools((current) => ({ ...current, font: look.font, size: look.size }))
  }, [look.font, look.size])

  const saveSelection = useCallback(() => {
    const selection = document.getSelection()
    if (selection && selection.rangeCount && inBox(selection.anchorNode)) {
      saved.current = selection.getRangeAt(0).cloneRange()
    }
  }, [inBox])

  useEffect(() => {
    function onSelection() {
      const selection = document.getSelection()
      if (!inBox(selection?.anchorNode ?? null)) return
      saveSelection()
      refresh()
    }
    document.addEventListener('selectionchange', onSelection)
    return () => document.removeEventListener('selectionchange', onSelection)
  }, [inBox, refresh, saveSelection])

  function restoreSelection() {
    const node = box.current
    if (!node) return
    node.focus({ preventScroll: true })
    const range = saved.current
    if (!range) return
    const selection = document.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  function emit() {
    const node = box.current
    if (!node) return
    const clean = sanitizeRichHtml(node.innerHTML)
    lastValue.current = clean
    setEmpty(isRichEmpty(clean))
    onChange(clean)
  }

  /**
   * The browser's size command only knows seven steps, so sizes are applied
   * as step 7 and then given the exact pixel size here. Setting a style on
   * the element (instead of replacing it) keeps the selection where it is.
   */
  function pinSizes(px: number | null) {
    const node = box.current
    if (!node || !px) return
    node.querySelectorAll<HTMLElement>('font[size="7"], span[style*="xxx-large"]').forEach((el) => {
      el.style.fontSize = `${px}px`
      el.removeAttribute('size')
      // An inner size would win over the new one.
      el.querySelectorAll<HTMLElement>('[style*="font-size"]').forEach((inner) => inner.style.removeProperty('font-size'))
    })
  }

  function after() {
    pinSizes(pendingSize.current)
    saveSelection()
    emit()
    refresh()
  }

  function run(command: string, arg?: string, css = false) {
    restoreSelection()
    document.execCommand('styleWithCSS', false, css ? 'true' : 'false')
    document.execCommand(command, false, arg)
    after()
  }

  function setBlock(next: BlockFormat) {
    run('formatBlock', `<${next}>`)
  }

  function setSize(px: number) {
    pendingSize.current = px
    run('fontSize', '7', false)
  }

  function setFont(name: string) {
    run('fontName', fontStack(name), true)
  }

  function clearFormatting() {
    restoreSelection()
    document.execCommand('removeFormat')
    const anchor = document.getSelection()?.anchorNode
    const element = anchor instanceof Element ? anchor : anchor?.parentElement
    if (!element?.closest('li')) document.execCommand('formatBlock', false, '<p>')
    after()
  }

  function openLink() {
    saveSelection()
    setLinkUrl(tools.link ?? '')
    setPanel('link')
    window.setTimeout(() => linkInput.current?.focus(), 0)
  }

  function applyLink() {
    const url = normalizeUrl(linkUrl)
    if (!url) return
    restoreSelection()
    const selection = document.getSelection()
    const anchor = selection?.anchorNode
    const element = anchor instanceof Element ? anchor : anchor?.parentElement
    const existing = element?.closest('a')
    if (existing && box.current?.contains(existing) && selection?.isCollapsed) {
      existing.setAttribute('href', url)
    } else if (selection?.isCollapsed) {
      document.execCommand('insertHTML', false, `<a href="${escapeHtml(url)}">${escapeHtml(linkUrl.trim())}</a>`)
    } else {
      document.execCommand('createLink', false, url)
    }
    setPanel(null)
    after()
  }

  function removeLink() {
    restoreSelection()
    const selection = document.getSelection()
    const anchor = selection?.anchorNode
    const element = anchor instanceof Element ? anchor : anchor?.parentElement
    const existing = element?.closest('a')
    if (existing && selection?.isCollapsed) {
      const range = document.createRange()
      range.selectNodeContents(existing)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    document.execCommand('unlink')
    setPanel(null)
    after()
  }

  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const html = event.clipboardData.getData('text/html')
    const text = event.clipboardData.getData('text/plain')
    if (!html && !/\n\s*\n/.test(text)) {
      document.execCommand('insertText', false, text)
      after()
      return
    }
    let clean = html ? sanitizeRichHtml(html) : textToRichHtml(text)
    // A single pasted paragraph goes into the current one instead of
    // splitting it.
    const single = clean.match(/^<p>(.*)<\/p>$/s)
    if (single && !single[1].includes('<p')) clean = single[1]
    document.execCommand('insertHTML', false, clean)
    after()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const mod = event.ctrlKey || event.metaKey
    if (mod && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      openLink()
    }
  }

  function onFocus() {
    setFocused(true)
    document.execCommand('defaultParagraphSeparator', false, 'p')
    const node = box.current
    // Start an empty box with a paragraph so the first line is a <p>.
    if (node && !node.innerHTML.trim()) {
      node.innerHTML = '<p><br></p>'
      const range = document.createRange()
      range.setStart(node.firstChild!, 0)
      range.collapse(true)
      const selection = document.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }

  const keep = (event: React.MouseEvent) => event.preventDefault()

  return (
    <div
      className={
        'rte-shell rounded-[var(--r-sm)] border bg-surface transition-[border-color,box-shadow] ' +
        (focused || panel ? 'border-forest shadow-[0_0_0_1px_var(--studio-forest)]' : 'border-[#949494] hover:border-ink-2')
      }
    >
      <div
        role="toolbar"
        aria-label={t('{label} formatting', { label })}
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-[var(--r-sm)] border-b border-line bg-panel px-1 py-1"
      >
        {!compact ? (
          <select
            aria-label={t("Text style")}
            title={t("Text style")}
            value={tools.block}
            onChange={(event) => setBlock(event.target.value as BlockFormat)}
            className="rte-select w-[118px]"
          >
            {BLOCKS.map(([key, name]) => (
              <option key={key} value={key}>
                {t(name)}
              </option>
            ))}
          </select>
        ) : null}
        <select
          aria-label={t("Font")}
          title={t("Font")}
          value={tools.font}
          onChange={(event) => setFont(event.target.value)}
          className="rte-select w-[128px]"
        >
          {FONTS.map((font) => (
            <option key={font.name} value={font.name} style={{ fontFamily: font.stack }}>
              {font.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t("Font size")}
          title={t("Font size")}
          value={String(tools.size)}
          onChange={(event) => setSize(Number(event.target.value))}
          className="rte-select w-[64px]"
        >
          {(FONT_SIZES.includes(tools.size) ? FONT_SIZES : [...FONT_SIZES, tools.size].sort((a, b) => a - b)).map((size) => (
            <option key={size} value={String(size)}>
              {size}
            </option>
          ))}
        </select>
        <Divider />
        <Tool label={t("Bold (Ctrl+B)")} active={tools.bold} onMouseDown={keep} onClick={() => run('bold')}>
          <span className="text-[15px] font-bold">{t("B")}</span>
        </Tool>
        <Tool label={t("Italic (Ctrl+I)")} active={tools.italic} onMouseDown={keep} onClick={() => run('italic')}>
          <span className="font-serif text-[16px] italic">{t("I")}</span>
        </Tool>
        <Tool label={t("Underline (Ctrl+U)")} active={tools.underline} onMouseDown={keep} onClick={() => run('underline')}>
          <span className="text-[15px] underline underline-offset-2">{t("U")}</span>
        </Tool>
        <Tool label={t("Strikethrough")} active={tools.strike} onMouseDown={keep} onClick={() => run('strikeThrough')}>
          <span className="text-[15px] line-through">{t("S")}</span>
        </Tool>
        <Tool
          label={t("Text colour")}
          expanded={panel === 'color'}
          controls={panelId}
          onMouseDown={keep}
          onClick={() => {
            saveSelection()
            setPanel(panel === 'color' ? null : 'color')
          }}
        >
          <IconTextColor />
        </Tool>
        <Tool
          label={t("Highlight")}
          expanded={panel === 'highlight'}
          controls={panelId}
          onMouseDown={keep}
          onClick={() => {
            saveSelection()
            setPanel(panel === 'highlight' ? null : 'highlight')
          }}
        >
          <IconHighlight />
        </Tool>
        <Divider />
        <Tool label={t("Bulleted list")} active={tools.ul} onMouseDown={keep} onClick={() => run('insertUnorderedList')}>
          <IconBullets />
        </Tool>
        <Tool label={t("Numbered list")} active={tools.ol} onMouseDown={keep} onClick={() => run('insertOrderedList')}>
          <IconNumbers />
        </Tool>
        {!compact ? (
          <>
            <Tool label={t("Decrease indent")} onMouseDown={keep} onClick={() => run('outdent', undefined, true)}>
              <IconOutdent />
            </Tool>
            <Tool label={t("Increase indent")} onMouseDown={keep} onClick={() => run('indent', undefined, true)}>
              <IconIndent />
            </Tool>
          </>
        ) : null}
        <Divider />
        <Tool label={t("Align left")} active={tools.align === 'left'} onMouseDown={keep} onClick={() => run('justifyLeft', undefined, true)}>
          <IconAlign kind="left" />
        </Tool>
        <Tool label={t("Center")} active={tools.align === 'center'} onMouseDown={keep} onClick={() => run('justifyCenter', undefined, true)}>
          <IconAlign kind="center" />
        </Tool>
        <Tool label={t("Align right")} active={tools.align === 'right'} onMouseDown={keep} onClick={() => run('justifyRight', undefined, true)}>
          <IconAlign kind="right" />
        </Tool>
        <Divider />
        <Tool
          label={tools.link ? t("Edit link (Ctrl+K)") : t("Insert link (Ctrl+K)")}
          active={Boolean(tools.link)}
          expanded={panel === 'link'}
          controls={panelId}
          onMouseDown={keep}
          onClick={() => (panel === 'link' ? setPanel(null) : openLink())}
        >
          <IconLink />
        </Tool>
        <Tool label={t("Clear formatting")} onMouseDown={keep} onClick={clearFormatting}>
          <IconClear />
        </Tool>
        <span className="ml-auto flex items-center">
          <Tool label={t("Undo (Ctrl+Z)")} onMouseDown={keep} onClick={() => run('undo')}>
            <IconUndo />
          </Tool>
          <Tool label={t("Redo (Ctrl+Y)")} onMouseDown={keep} onClick={() => run('redo')}>
            <IconUndo flip />
          </Tool>
        </span>
      </div>

      {panel ? (
        <div id={panelId} className="border-b border-line bg-surface px-2.5 py-2">
          {panel === 'link' ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={linkInput}
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    applyLink()
                  } else if (event.key === 'Escape') {
                    event.preventDefault()
                    setPanel(null)
                    restoreSelection()
                  }
                }}
                placeholder={t("https://aka.ms/… or name@microsoft.com")}
                aria-label={t("Link address")}
                className="ui-field ui-field-sm min-w-0 flex-1 basis-48"
              />
              <button type="button" className="ui-btn ui-btn-primary min-h-7 px-3 py-0.5 text-[12px]" onClick={applyLink}>
                {tools.link ? t("Update") : t("Add link")}
              </button>
              {tools.link ? (
                <button type="button" className="ui-btn ui-btn-ghost min-h-7 px-3 py-0.5 text-[12px]" onClick={removeLink}>
                  {t("Remove link")}</button>
              ) : null}
            </div>
          ) : (
            <Swatches
              colors={panel === 'color' ? TEXT_COLORS : HIGHLIGHTS}
              noneLabel={panel === 'highlight' ? t("No highlight") : t("Automatic")}
              suffix={panel === 'highlight' ? 'highlight' : 'text'}
              onPick={(color) => {
                if (panel === 'color') run('foreColor', color ?? '#242424', true)
                else run('hiliteColor', color ?? 'transparent', true)
              }}
              onCustom={(color) => {
                if (panel === 'color') run('foreColor', color, true)
                else run('hiliteColor', color, true)
              }}
              onDone={() => setPanel(null)}
            />
          )}
        </div>
      ) : null}

      <div className="relative">
        {empty ? (
          <p aria-hidden="true" className="pointer-events-none absolute top-3 left-3.5 text-[15px] leading-[1.55] text-subtle">
            {placeholder}
          </p>
        ) : null}
        <div
          ref={box}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={(event) => {
            // Japanese, Chinese, and Korean input: save once the IME has finished composing.
            if ((event.nativeEvent as InputEvent).isComposing) return
            after()
          }}
          onCompositionEnd={after}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onFocus={onFocus}
          onBlur={() => {
            setFocused(false)
            saveSelection()
          }}
          className="rte-content px-3.5 py-3 outline-none"
          style={{ minHeight, fontFamily: fontStack(look.font), fontSize: look.size }}
        />
      </div>
    </div>
  )
}

function Tool({
  label,
  active,
  expanded,
  controls,
  onClick,
  onMouseDown,
  children,
}: {
  label: string
  active?: boolean
  expanded?: boolean
  controls?: string
  onClick: () => void
  onMouseDown: (event: React.MouseEvent) => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      aria-expanded={expanded === undefined ? undefined : expanded}
      aria-controls={expanded === undefined ? undefined : controls}
      onMouseDown={onMouseDown}
      onClick={onClick}
      className={
        'inline-flex h-7 min-w-7 items-center justify-center rounded-[4px] px-1 text-ink-2 transition-colors hover:bg-fill-hover hover:text-ink ' +
        (active || expanded ? 'bg-forest-soft text-forest hover:bg-forest-soft hover:text-forest' : '')
      }
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-line-strong" />
}

function Swatches({
  colors,
  noneLabel,
  suffix,
  onPick,
  onCustom,
  onDone,
}: {
  colors: [string, string][]
  noneLabel: string
  /** Names each swatch for screen readers, e.g. "Purple text". */
  suffix: string
  onPick: (color: string | null) => void
  onCustom: (color: string) => void
  onDone: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onPick(null)}
        className="ui-btn ui-btn-ghost min-h-6 px-2 py-0 text-[12px] font-normal"
      >
        {noneLabel}
      </button>
      {colors.map(([color, name]) => (
        <button
          key={color}
          type="button"
          title={t(name)}
          aria-label={t(suffix === 'highlight' ? '{name} highlight' : '{name} text', { name: t(name) })}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(color)}
          className="h-6 w-6 rounded-full ring-1 ring-line-strong ring-inset transition-transform hover:scale-110"
          style={{ background: color }}
        />
      ))}
      <label className="relative ml-1 flex h-6 cursor-pointer items-center gap-1 rounded-full px-2 text-[12px] text-ink-2 ring-1 ring-line-strong hover:bg-fill">
        <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
        {t("Custom")}<input
          type="color"
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={t("Custom colour")}
          onChange={(event) => onCustom(event.target.value.toUpperCase())}
        />
      </label>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onDone}
        className="ml-auto text-[12px] font-semibold text-forest hover:underline"
      >
        {t("Done")}</button>
    </div>
  )
}

const stroke = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, fill: 'none' }

function IconTextColor() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.5 11 8 2.5 11.5 11M5.8 8h4.4" {...stroke} strokeLinejoin="round" />
      <rect x="2.5" y="12.75" width="11" height="2" rx="0.5" fill="#A4262C" />
    </svg>
  )
}

function IconHighlight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m9.5 2.5 3 3-5.5 5.5H4v-3l5.5-5.5Z" {...stroke} strokeLinejoin="round" />
      <rect x="2.5" y="12.75" width="11" height="2" rx="0.5" fill="#FFB900" />
    </svg>
  )
}

function IconBullets() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="3" cy="4" r="1.1" fill="currentColor" />
      <circle cx="3" cy="8" r="1.1" fill="currentColor" />
      <circle cx="3" cy="12" r="1.1" fill="currentColor" />
      <path d="M6.5 4h7M6.5 8h7M6.5 12h7" {...stroke} />
    </svg>
  )
}

function IconNumbers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <text x="1" y="6" fontSize="5.5" fontWeight="700" fill="currentColor">1</text>
      <text x="1" y="13.5" fontSize="5.5" fontWeight="700" fill="currentColor">2</text>
      <path d="M6.5 4h7M6.5 8h7M6.5 12h7" {...stroke} />
    </svg>
  )
}

function IconIndent() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 3h11M7 6.5h6.5M7 10h6.5M2.5 13.5h11M2.5 6l2.5 2.25L2.5 10.5" {...stroke} strokeLinejoin="round" />
    </svg>
  )
}

function IconOutdent() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 3h11M7 6.5h6.5M7 10h6.5M2.5 13.5h11M5 6 2.5 8.25 5 10.5" {...stroke} strokeLinejoin="round" />
    </svg>
  )
}

function IconAlign({ kind }: { kind: 'left' | 'center' | 'right' }) {
  const short = kind === 'left' ? 'M2.5 6.5h7M2.5 13h7' : kind === 'center' ? 'M4.5 6.5h7M4.5 13h7' : 'M6.5 6.5h7M6.5 13h7'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d={`M2.5 3.25h11M2.5 9.75h11${short.replace(/M/g, ' M')}`} {...stroke} />
    </svg>
  )
}

function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6.75 9.25a2.5 2.5 0 0 0 3.54 0l2.47-2.47a2.5 2.5 0 0 0-3.54-3.54l-.9.9M9.25 6.75a2.5 2.5 0 0 0-3.54 0L3.24 9.22a2.5 2.5 0 0 0 3.54 3.54l.9-.9"
        {...stroke}
      />
    </svg>
  )
}

function IconClear() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 3.5h8M7 3.5 5 12.5M10 9.5l4 4M14 9.5l-4 4" {...stroke} />
    </svg>
  )
}

function IconUndo({ flip }: { flip?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M5.5 3 2.5 6l3 3M2.5 6h7a4 4 0 0 1 0 8H7" {...stroke} strokeLinejoin="round" />
    </svg>
  )
}
