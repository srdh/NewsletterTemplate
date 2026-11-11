import type { Lang } from '../../lib/i18n'
import { STARTERS_ES } from './es'
import { STARTERS_FR } from './fr'
import { STARTERS_JA } from './ja'

/*
 * Starter text in the new email's language. Starter files wrap their English
 * text in T(); each language's text is in ./fr.ts, ./ja.ts, ./es.ts, keyed by
 * that English. Text with no entry stays in English.
 */

export type StarterT = (english: string, params?: Record<string, string | number>) => string

const DICTIONARIES: Record<Lang, Record<string, string>> = { en: {}, fr: STARTERS_FR, ja: STARTERS_JA, es: STARTERS_ES }

export function starterT(lang: Lang): StarterT {
  return (english, params) => {
    const text = DICTIONARIES[lang][english] ?? english
    return params ? text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole)) : text
  }
}
