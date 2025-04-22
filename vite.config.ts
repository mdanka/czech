import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
    VitePWA({ 
      registerType: 'autoUpdate',
      manifest: {
        name: "Czech Practice",
        short_name: "Czech",
        description: "Practise Czech grammar and declensions in an interactive app with over 50000 words",
        background_color: '#ffffff',
        theme_color: "#222222",
        start_url: "/?utm_source=a2hs",
        display: "standalone",
        icons: [
          {
            src: "/favicon_32x32.png",
            sizes: "32x32",
            type: "image/png"
          },
          {
            src: "/favicon_512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
    })
  ],
  // Optional: Configure server port if needed (default is 5173)
  // server: {
  //   port: 8543 // Example: Match old webpack-dev-server port
  // }
}) 