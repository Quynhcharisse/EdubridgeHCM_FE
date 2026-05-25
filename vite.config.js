import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

function manualChunks(id) {
  if (!id.includes('node_modules')) {
    return undefined
  }

  // React internals + MUI + emotion + notistack must stay together to avoid circular chunks
  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/react-router-dom/') ||
    id.includes('/scheduler/') ||
    id.includes('/use-sync-external-store/') ||
    id.includes('@mui/material') ||
    id.includes('@mui/system') ||
    id.includes('@mui/utils') ||
    id.includes('@mui/base') ||
    id.includes('@emotion') ||
    id.includes('notistack')
  ) {
    return 'vendor-ui-core'
  }

  if (id.includes('framer-motion')) {
    return 'vendor-motion'
  }

  if (id.includes('@mui/icons-material')) {
    return 'vendor-mui-icons'
  }

  if (id.includes('@mui/x-charts')) {
    return 'vendor-mui-charts'
  }

  if (id.includes('leaflet') || id.includes('react-leaflet')) {
    return 'vendor-maps'
  }

  if (id.includes('@tiptap')) {
    return 'vendor-tiptap'
  }

  if (id.includes('firebase')) {
    return 'vendor-firebase'
  }

  if (
    id.includes('@stomp/stompjs') ||
    id.includes('sockjs-client') ||
    id.includes('/faye-websocket/') ||
    id.includes('/eventsource/') ||
    id.includes('/url-parse/') ||
    id.includes('/inherits/')
  ) {
    return 'vendor-realtime'
  }

  if (id.includes('@react-oauth/google') || id.includes('axios')) {
    return 'vendor-ui-core'
  }

  if (
    id.includes('xlsx') ||
    id.includes('jwt-decode') ||
    id.includes('debounce')
  ) {
    return 'vendor-data'
  }

  if (id.includes('react-icons')) {
    return 'vendor-icons'
  }

  return undefined
}

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
