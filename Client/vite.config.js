import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localDataServer } from './localDataServer.js'

export default defineConfig(({ mode }) => ({
  // The empty prefix loads SMTP_* too; only the local server sees them, never the browser bundle.
  plugins: [react(), tailwindcss(), localDataServer(loadEnv(mode, process.cwd(), ''))],
  // Uploaded photos and the shared workspace are written here at runtime; they must not trigger a reload.
  server: { watch: { ignored: ['**/local-data/**'] } },
}))
