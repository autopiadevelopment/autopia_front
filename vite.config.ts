import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En desarrollo, /api se redirige al backend: sin problemas de CORS
    proxy: { '/api': 'http://localhost:3000' },
  },
})
