import { useEffect, useState } from 'react'
import type { CampaignBundle } from '../types'
import { convertBundleLanguage } from '../lib/convertLanguage'
import { emailLang, langTag } from '../lib/emailText'
import { LANGUAGES, t, type Lang } from '../lib/i18n'

/**
 * The email's own language. It sets the email's fixed wording (table
 * headings, "Best regards,", the footer), its html lang, the language
 * Copilot writes in, and the language its fields take input in. Switching it
 * also switches text that is still starter wording; text you wrote stays.
 */
export function EmailLanguageField({ bundle, onChange }: { bundle: CampaignBundle; onChange: (bundle: CampaignBundle) => void }) {
  const lang = emailLang(bundle.campaign)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function pick(next: Lang) {
    if (next === lang || busy) return
    setBusy(true)
    try {
      const { bundle: converted, changed } = await convertBundleLanguage(bundle, next)
      onChange(converted)
      const name = LANGUAGES.find((option) => option.id === next)?.name ?? next
      setNote(
        changed
          ? t('Switched {n} starter texts to {language}. Text you wrote yourself stays as it is: ask Copilot to translate it.', { n: changed, language: name })
          : t('No starter text to switch. Text you wrote yourself stays as it is: ask Copilot to translate it.'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div role="radiogroup" aria-label={t('Email language')} aria-busy={busy} className="grid gap-1">
      <span className="text-[12px] font-medium text-muted">{t('Email language')}</span>
      <div className="flex flex-wrap gap-1.5">
        {LANGUAGES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={lang === option.id}
            lang={option.id}
            disabled={busy}
            onClick={() => void pick(option.id)}
            className={
              'flex min-h-8 items-center gap-1.5 rounded-[var(--r-md)] px-3 text-[13px] ring-1 ring-inset transition-colors disabled:opacity-60 ' +
              (lang === option.id ? 'bg-forest-soft font-semibold text-ink ring-forest' : 'text-ink-2 ring-line-strong hover:bg-fill')
            }
          >
            <span className="font-mono text-[11px] font-semibold text-muted">{option.short}</span>
            {option.name}
          </button>
        ))}
      </div>
      <span className="text-[11px] leading-4 text-muted">
        {t('Sets the email’s fixed wording (headings, buttons, footer), the language you type and Copilot writes in, and switches starter text.')}
      </span>
      {note ? (
        <span role="status" className="text-[12px] leading-4 text-ink-2">
          {note}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Tags every text field, text area, and rich text box in the form with the
 * email's language, so spelling checks, input methods (IME), and fonts follow
 * the email rather than the studio.
 */
export function useEmailInputLanguage(campaignLang: string | undefined) {
  const lang = langTag(emailLang({ language: campaignLang }))
  useEffect(() => {
    const pane = document.getElementById('pane-fields')
    if (!pane) return
    const tag = () => {
      for (const element of pane.querySelectorAll<HTMLElement>('input:not([type]), input[type="text"], input[type="url"], textarea, [contenteditable="true"]')) {
        if (element.getAttribute('lang') !== lang) element.setAttribute('lang', lang)
      }
    }
    tag()
    const observer = new MutationObserver(tag)
    observer.observe(pane, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [lang])
}
