import { Studio } from './components/Studio'
import { useUiLang } from './lib/i18n'

export default function App() {
  // Re-render everything when the studio language changes.
  useUiLang()
  return <Studio />
}
