import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'KinoMaya Beta',
        short_name: 'KinoMaya',
        description: 'AI Entertainment Companion',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/7798/7798220.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});
