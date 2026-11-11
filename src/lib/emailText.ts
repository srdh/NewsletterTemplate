import { EMAIL_FR } from '../locales/emailFr'
import { asLang, type Lang } from './i18n'

/*
 * The fixed wording inside the emails themselves (table headings, "Best
 * regards,", the footer's copyright line, event card labels…), in the
 * email's own language. That is Campaign.language, not the studio language:
 * a French email reads the same whoever edits it.
 */

export type EmailT = (english: string, params?: Record<string, string | number>) => string

const DICTIONARIES: Record<Lang, Record<string, string>> = { en: {}, fr: EMAIL_FR }

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
  return lang === 'fr' ? 'fr-FR' : 'en-US'
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
