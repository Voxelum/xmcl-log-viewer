import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Ensure correct asset paths when served from https://voxelum.github.io/xmcl-log-viewer/
  base: '/xmcl-log-viewer/',
})
