import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // three.js + postprocessing is a single lazily loaded chunk
    chunkSizeWarningLimit: 700
  },
  server: {
    port: 3000,
    host: true
  },
  assetsInclude: ['**/*.glb', '**/*.gltf']
})
