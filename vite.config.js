import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: false, // if 5180 is busy, Vite will just pick the next free port instead of erroring
  },
})
