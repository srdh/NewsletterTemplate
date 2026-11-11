import { LANGUAGES, setUiLang, t, useUiLang, type Lang } from '../lib/i18n'

/**
 * En / Fr toggle for the studio interface. Each email has its own language
 * in Email settings; this one only changes the studio's menus and labels.
 */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const lang = useUiLang()
  return (
    <div
      role="radiogroup"
      aria-label={t('Studio language')}
      title={t('Studio language')}
      className={'flex shrink-0 items-center rounded-full bg-fill p-0.5 ring-1 ring-line ring-inset ' + className}
    >
      {LANGUAGES.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={lang === option.id}
          aria-label={option.name}
          lang={option.id}
          onClick={() => setUiLang(option.id as Lang)}
          className={
            'min-h-7 min-w-9 rounded-full px-2 text-[12px] font-semibold leading-4 transition-colors ' +
            (lang === option.id ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink')
          }
        >
          {option.short}
        </button>
      ))}
    </div>
  )
}
