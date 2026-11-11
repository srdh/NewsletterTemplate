import { LANGUAGES, asLang, t, type Lang } from '../lib/i18n'

/**
 * The email's own language. It sets the email's fixed wording (table
 * headings, "Best regards,", the footer), its html lang, and the language
 * Copilot writes in. Text already written stays as it is.
 */
export function EmailLanguageField({ value, onChange }: { value: string | undefined; onChange: (lang: Lang) => void }) {
  const lang = asLang(value)
  return (
    <div role="radiogroup" aria-label={t('Email language')} className="grid gap-1">
      <span className="text-[12px] font-medium text-muted">{t('Email language')}</span>
      <div className="flex flex-wrap gap-1.5">
        {LANGUAGES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={lang === option.id}
            lang={option.id}
            onClick={() => onChange(option.id)}
            className={
              'flex min-h-8 items-center gap-1.5 rounded-[var(--r-md)] px-3 text-[13px] ring-1 ring-inset transition-colors ' +
              (lang === option.id ? 'bg-forest-soft font-semibold text-ink ring-forest' : 'text-ink-2 ring-line-strong hover:bg-fill')
            }
          >
            <span className="font-mono text-[11px] font-semibold text-muted">{option.short}</span>
            {option.name}
          </button>
        ))}
      </div>
      <span className="text-[11px] leading-4 text-muted">
        {t('Sets the email’s fixed wording (headings, buttons, footer) and the language Copilot writes in. Text you wrote stays as it is.')}
      </span>
    </div>
  )
}
