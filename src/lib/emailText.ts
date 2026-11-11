import { EMAIL_ES } from '../locales/emailEs'
import { EMAIL_FR } from '../locales/emailFr'
import { EMAIL_JA } from '../locales/emailJa'
import { asLang, langTag as tagFor, type Lang } from './i18n'

/*
 * The fixed wording inside the emails themselves (table headings, "Best
 * regards,", the footer's copyright line, event card labels…), in the
 * email's own language. That is Campaign.language, not the studio language:
 * a French email reads the same whoever edits it.
 */

export type EmailT = (english: string, params?: Record<string, string | number>) => string

const DICTIONARIES: Record<Lang, Record<string, string>> = { en: {}, fr: EMAIL_FR, ja: EMAIL_JA, es: EMAIL_ES }

/** The language an email is written in (English unless set). */
export function emailLang(campaign: { language?: string }): Lang {
  return asLang(campaign.language)
}

/** Translates fixed email wording into a language; {name} placeholders are filled from params. */
export function emailT(lang: Lang): EmailT {
  return (english, params) => {
    const text = DICTIONARIES[lang][english] ?? english
    return params ? text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole)) : text
  }
}

/** BCP 47 tag for the email's html lang attribute and date formatting. */
export function langTag(lang: Lang): string {
  return tagFor(lang)
}

/**
 * A font stack for the email's language. Japanese adds Japanese fonts before
 * the generic family, so mail apps without font fallback still show the text well.
 */
export function fontsFor(stack: string, lang: Lang): string {
  if (lang !== 'ja') return stack
  const japanese = "'Yu Gothic UI','Yu Gothic',Meiryo,'Hiragino Sans','MS PGothic'"
  return /,\s*sans-serif\s*$/.test(stack) ? stack.replace(/,\s*sans-serif\s*$/, `,${japanese},sans-serif`) : `${stack},${japanese}`
}

let editing: Lang = 'en'

/**
 * The language of the email open in the form. New blocks, rows, and cards
 * start with their default text in it. Set by the form on every render.
 */
export function editingEmailLang(): Lang {
  return editing
}

export function setEditingEmailLang(lang: Lang): void {
  editing = lang
}

/** Adds Japanese fonts to every Segoe UI font stack in an email's HTML (Japanese emails only). */
export function japaneseFonts(html: string, lang: Lang): string {
  if (lang !== 'ja') return html
  return html.replace(/font-family:\s*'Segoe UI',Tahoma,Arial,sans-serif/g, (stack) => `font-family:${fontsFor(stack.replace(/^font-family:\s*/, ''), 'ja')}`)
}
