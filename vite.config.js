import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// ESM environments mein __dirname define karne ke liye standard production code
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Local Dev Server Middleware for /api/youtube
function youtubeApiDevPlugin() {
  return {
    name: 'youtube-api-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/youtube', async (req, res) => {
        try {
          const { default: handler } = await import('./api/youtube.js');
          const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const query = Object.fromEntries(parsedUrl.searchParams.entries());
          
          req.query = query;
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };

          await handler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    youtubeApiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'logo.png', 'logo.svg'],
      manifest: {
        name: 'Foclyra — Distraction-Free Study Studio',
        short_name: 'Foclyra',
        description: 'Distraction-free, local-first study studio with live timestamped notes',
        theme_color: '#00F5D4',
        background_color: '#111216',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
