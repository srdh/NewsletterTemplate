import type { Lang } from '../../lib/i18n'
import { STARTERS_FR } from './fr'

/*
 * Starter text in the new email's language. Starter files wrap their English
 * text in T(); the French is in ./fr.ts, keyed by that English. Text with no
 * French entry stays in English.
 */

export type StarterT = (english: string, params?: Record<string, string | number>) => string

export function starterT(lang: Lang): StarterT {
  return (english, params) => {
    const text = lang === 'fr' ? (STARTERS_FR[english] ?? english) : english
    return params ? text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole)) : text
  }
}
