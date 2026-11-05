import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { claudeFillPlugin } from './vite.claude-plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), claudeFillPlugin()],
})
