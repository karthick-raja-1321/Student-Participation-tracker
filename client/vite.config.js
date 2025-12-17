import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5713,
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
      port: 5713,
      protocol: 'ws'
    }
  }
})
