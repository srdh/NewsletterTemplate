import type { CampaignBundle } from '../types'
import { EMAIL_ES } from '../locales/emailEs'
import { EMAIL_FR } from '../locales/emailFr'
import { EMAIL_JA } from '../locales/emailJa'
import { emailLang } from './emailText'
import { LANGUAGES, type Lang } from './i18n'

/*
 * Switching an email's language also switches the text that is still
 * starter or default wording (headings, table cells, placeholders, whole
 * starter paragraphs) to the new language. Text the person changed stays as
 * they wrote it: only exact matches of known phrases are switched.
 *
 * Phrases come from the email wording dictionaries (locales/email*.ts) and
 * the starter dictionaries (data/starters/*.ts), keyed by their English.
 */

type Phrase = { english: string; text: Record<Lang, string>; pattern?: Record<Lang, RegExp> }

const LANGS = LANGUAGES.map((language) => language.id)
const EMAIL: Record<Lang, Record<string, string>> = { en: {}, fr: EMAIL_FR, ja: EMAIL_JA, es: EMAIL_ES }

/** Fields that never hold wording: ids, dates, images, links. */
const SKIP_FIELDS = new Set(['id', 'campaign_id', 'master_type', 'created_at', 'updated_at', 'language', 'banner_image', 'section_image', 'newsletter'])

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** A whole-string pattern for a phrase with {name} slots; a repeated slot must match the same text. */
function patternFor(text: string): RegExp {
  const seen = new Set<string>()
  const source = text
    .split(/(\{\w+\})/)
    .map((part) => {
      const slot = part.match(/^\{(\w+)\}$/)
      if (!slot) return escapeRegExp(part)
      if (seen.has(slot[1])) return `\\k<${slot[1]}>`
      seen.add(slot[1])
      return `(?<${slot[1]}>[\\s\\S]+?)`
    })
    .join('')
  return new RegExp(`^${source}$`)
}

/** Long enough, or marked up, to be found safely inside other text. */
function isLong(text: string): boolean {
  return text.length >= 28 || /<[a-z]/i.test(text)
}

class Converter {
  private byText = new Map<string, Phrase>()
  private patterns: Phrase[] = []
  /** Long phrases (or ones with markup), longest first: safe to find inside a larger HTML string. */
  private long: { text: string; phrase: Phrase }[] = []
  /** Long phrases with {slots}, as patterns that can match inside a larger string. */
  private longPatterns: { pattern: RegExp; phrase: Phrase }[] = []
  changed = 0

  constructor(starters: Record<Lang, Record<string, string>>) {
    const english = new Set<string>()
    for (const lang of LANGS) {
      for (const key of Object.keys(EMAIL[lang])) english.add(key)
      for (const key of Object.keys(starters[lang])) english.add(key)
    }
    for (const key of english) {
      const text = {} as Record<Lang, string>
      for (const lang of LANGS) text[lang] = lang === 'en' ? key : (starters[lang][key] ?? EMAIL[lang][key] ?? key)
      const phrase: Phrase = { english: key, text }
      if (/\{\w+\}/.test(key)) {
        phrase.pattern = {} as Record<Lang, RegExp>
        for (const lang of LANGS) phrase.pattern[lang] = patternFor(text[lang])
        this.patterns.push(phrase)
        for (const lang of LANGS) {
          if (isLong(text[lang])) this.longPatterns.push({ pattern: new RegExp(patternFor(text[lang]).source.slice(1, -1), 'g'), phrase })
        }
      } else {
        // Every language's version points back to the phrase, so text in any language converts.
        for (const lang of LANGS) {
          if (!this.byText.has(text[lang])) this.byText.set(text[lang], phrase)
          if (isLong(text[lang])) this.long.push({ text: text[lang], phrase })
        }
      }
    }
    this.long.sort((a, b) => b.text.length - a.text.length)
  }

  /** The string in the target language, or the same string when it is not a known phrase. */
  convert(value: string, to: Lang): string {
    if (!value.trim()) return value
    const exact = this.byText.get(value)
    if (exact) return this.count(value, exact.text[to])
    for (const phrase of this.patterns) {
      for (const lang of LANGS) {
        const match = phrase.pattern![lang].exec(value)
        if (!match) continue
        const slots = match.groups ?? {}
        const filled = phrase.text[to].replace(/\{(\w+)\}/g, (whole, key: string) => (key in slots ? this.convert(slots[key], to) : whole))
        return this.count(value, filled)
      }
    }
    // HTML: first whole starter paragraphs inside it (several joined, or wrapped in a span),
    // then each remaining text run that is a known phrase on its own (a table cell, a heading, a button label).
    if (/<[a-z][^>]*>/i.test(value)) {
      let html = value
      for (const { text, phrase } of this.long) {
        if (html.includes(text) && text !== phrase.text[to]) {
          html = html.split(text).join(phrase.text[to])
          this.changed++
        }
      }
      for (const { pattern, phrase } of this.longPatterns) {
        pattern.lastIndex = 0
        html = html.replace(pattern, (...args) => {
          const groups = (args[args.length - 1] ?? {}) as Record<string, string>
          const filled = phrase.text[to].replace(/\{(\w+)\}/g, (whole, key: string) => (key in groups ? groups[key] : whole))
          if (filled !== args[0]) this.changed++
          return filled
        })
      }
      return html
        .split(/(<[^>]+>)/)
        .map((part) => {
          if (part.startsWith('<') || !part.trim()) return part
          const lead = part.match(/^\s*/)![0]
          const trail = part.match(/\s*$/)![0]
          const core = part.trim()
          const phrase = this.byText.get(core)
          return phrase ? lead + this.count(core, phrase.text[to]) + trail : part
        })
        .join('')
    }
    // Bracketed placeholders inside a longer line, such as "[Region] [Event name] · [Mon YYYY]".
    return value.replace(/\[[^\]\n]{1,80}\]/g, (token) => {
      const phrase = this.byText.get(token)
      return phrase ? this.count(token, phrase.text[to]) : token
    })
  }

  private count(before: string, after: string): string {
    if (before !== after) this.changed++
    return after
  }

  /** Converts every string in a JSON-like value. */
  walk<T>(value: T, to: Lang, skip: Set<string> = new Set()): T {
    if (typeof value === 'string') return this.convert(value, to) as T
    if (Array.isArray(value)) return value.map((item) => this.walk(item, to, skip)) as T
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [key, item] of Object.entries(value)) {
        out[key] = skip.has(key) || /url$|^src$|^href$|^photo$|^logo$|^image$|rightLogo/i.test(key) ? item : this.walk(item, to, skip)
      }
      return out as T
    }
    return value
  }
}

/**
 * The email in another language: its language is set, and its starter and
 * default wording is switched. Returns how many texts were switched.
 */
export async function convertBundleLanguage(bundle: CampaignBundle, to: Lang): Promise<{ bundle: CampaignBundle; changed: number }> {
  if (emailLang(bundle.campaign) === to) return { bundle, changed: 0 }
  const { starterDictionaries } = await import('../data/starters/lang')
  const converter = new Converter(starterDictionaries())
  const c = bundle.campaign
  const campaign = { ...converter.walk(c, to, SKIP_FIELDS), id: c.id, language: to }
  if (c.newsletter) {
    try {
      campaign.newsletter = JSON.stringify(converter.walk(JSON.parse(c.newsletter) as unknown, to, new Set(['id', 'kind', 'version'])))
    } catch {
      campaign.newsletter = c.newsletter
    }
  }
  const rowSkip = new Set(['id', 'campaign_id', 'section', 'highlight', 'sort_order'])
  return {
    bundle: {
      campaign,
      agenda: converter.walk(bundle.agenda, to, rowSkip),
      spotlights: converter.walk(bundle.spotlights, to, rowSkip),
      rows: converter.walk(bundle.rows, to, rowSkip),
    },
    changed: converter.changed,
  }
}
