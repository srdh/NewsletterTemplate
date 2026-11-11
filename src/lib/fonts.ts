/*
 * Typefaces the Newsletter studio offers. Each has a fallback stack so the
 * email still reads well where the first font is not installed (Outlook on a
 * Mac, phones). Only these are kept when text is pasted or stored.
 */

export const FONTS: { name: string; stack: string }[] = [
  { name: 'Segoe UI', stack: "'Segoe UI',Tahoma,Arial,sans-serif" },
  { name: 'Aptos', stack: "Aptos,'Segoe UI',Arial,sans-serif" },
  { name: 'Calibri', stack: "Calibri,'Segoe UI',Arial,sans-serif" },
  { name: 'Arial', stack: 'Arial,Helvetica,sans-serif' },
  { name: 'Verdana', stack: 'Verdana,Geneva,sans-serif' },
  { name: 'Tahoma', stack: 'Tahoma,Geneva,sans-serif' },
  { name: 'Trebuchet MS', stack: "'Trebuchet MS',Arial,sans-serif" },
  { name: 'Georgia', stack: "Georgia,'Times New Roman',serif" },
  { name: 'Times New Roman', stack: "'Times New Roman',Times,serif" },
  { name: 'Courier New', stack: "'Courier New',Courier,monospace" },
  // Japanese: Windows and Mac fonts, then a broad fallback.
  { name: 'Yu Gothic', stack: "'Yu Gothic UI','Yu Gothic','Hiragino Sans',Meiryo,sans-serif" },
  { name: 'Meiryo', stack: "Meiryo,'Yu Gothic','Hiragino Sans',sans-serif" },
]

export const DEFAULT_FONT = 'Segoe UI'

/** Text sizes in pixels offered in the editor and for the body default. */
export const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36]

export const DEFAULT_SIZE = 15

/** The fallback stack for a font name; unknown names get the default. */
export function fontStack(name: string): string {
  return (FONTS.find((font) => font.name === name) ?? FONTS[0]).stack
}

/** Our font name for a CSS font-family value, or null if it is not one we offer. */
export function fontFromCss(value: string): string | null {
  const first = value.split(',')[0]?.trim().replace(/^["']|["']$/g, '').toLowerCase()
  if (!first) return null
  return FONTS.find((font) => font.name.toLowerCase() === first)?.name ?? null
}
