import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [vue(), VitePWA({
    manifest: {
      name: 'XMCL Log Viewer',
      short_name: 'LogViewer',
      start_url: '/xmcl-log-viewer/',
      scope: '/xmcl-log-viewer/',
      display: 'standalone',
      background_color: '#111111',
      theme_color: '#111111',
      description: 'View and analyze XMCL report zip logs offline.',
      icons: []
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    }
  })],
  // Ensure correct asset paths when served from https://voxelum.github.io/xmcl-log-viewer/
  base: '/xmcl-log-viewer/',
})
