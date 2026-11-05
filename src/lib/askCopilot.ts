import { createContext } from 'react'

/** Lets a form section hand Copilot a ready-made prompt for that section. */
export const AskCopilotContext = createContext<((section: string) => void) | null>(null)
