import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // fail immediately if 5173 is taken instead of silently using 5174
  },
  resolve: {
    // Deduplicate React so react-leaflet (hoisted to root node_modules) resolves
    // the same instance as the rest of the app — avoids "multiple React" errors.
    dedupe: ['react', 'react-dom'],
  },
})
