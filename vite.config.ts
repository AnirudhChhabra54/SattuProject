import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Prakash Jewellers Invoice',
        short_name: 'PJ Invoice',
        description: 'Invoice Generator for Prakash Jewellers',
        theme_color: '#d97706',
        icons: [
          {
            src: '/assets/Logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/Logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
