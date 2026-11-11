import { useSyncExternalStore } from 'react'
import { ES } from '../locales/es'
import { FR } from '../locales/fr'
import { JA } from '../locales/ja'

/*
 * Localization.
 *
 * English (the default), French, Japanese, and Spanish, used in two separate places:
 *  - the studio interface (menus, labels, buttons): the switch in the header,
 *    remembered in this browser. Read with t().
 *  - each email's own language (Campaign.language): fixed email wording,
 *    the starter text of new emails, and the language Copilot writes in.
 *    See lib/emailText.ts.
 *
 * The English text is the key: t('Add block') gives 'Ajouter un bloc' in
 * French, and falls back to the English when a phrase has no translation.
 * Add a language by adding its dictionary under locales/ and to LANGUAGES.
 */

export type Lang = 'en' | 'fr' | 'ja' | 'es'

export const LANGUAGES: { id: Lang; short: string; name: string }[] = [
  { id: 'en', short: 'En', name: 'English' },
  { id: 'fr', short: 'Fr', name: 'Français' },
  { id: 'ja', short: 'Ja', name: '日本語' },
  { id: 'es', short: 'Es', name: 'Español' },
]

const DICTIONARIES: Record<Lang, Record<string, string>> = { en: {}, fr: FR, ja: JA, es: ES }

const STORAGE_KEY = 'oft-template-maker/ui-language'

/** Reads a language code, falling back to English. */
export function asLang(value: unknown): Lang {
  return value === 'fr' || value === 'ja' || value === 'es' ? value : 'en'
}

/** BCP 47 tag for a language: dates, numbers, and the email's html lang. */
export function langTag(lang: Lang): string {
  return { en: 'en-US', fr: 'fr-FR', ja: 'ja-JP', es: 'es-ES' }[lang]
}

function stored(): Lang {
  try {
    return asLang(localStorage.getItem(STORAGE_KEY))
  } catch {
    return 'en'
  }
}

let current: Lang = stored()
const listeners = new Set<() => void>()
if (typeof document !== 'undefined') document.documentElement.lang = current

/** The studio interface language. */
export function uiLang(): Lang {
  return current
}

export function setUiLang(lang: Lang): void {
  if (lang === current) return
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Not saved: the choice still applies until the page reloads.
  }
  document.documentElement.lang = lang
  listeners.forEach((listener) => listener())
}

/** Re-renders the caller when the interface language changes. */
export function useUiLang(): Lang {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}

/**
 * Translates interface text into the studio language. {name} placeholders
 * are filled from params: t('Edited {n} min ago', { n: 5 }).
 */
export function t(english: string, params?: Record<string, string | number>): string {
  return translate(current, english, params)
}

/** Translates into a given language (for text that follows an email's language). */
export function translate(lang: Lang, english: string, params?: Record<string, string | number>): string {
  const text = DICTIONARIES[lang][english] ?? english
  return params ? text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole)) : text
}
