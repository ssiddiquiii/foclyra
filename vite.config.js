import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Unified Local Dev Server Middleware for all /api/* Serverless Endpoints
function apiDevPlugin() {
  return {
    name: 'foclyra-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/')) return next();

        const endpoint = url.split('?')[0].replace('/api/', '').trim();
        const handlers = {
          'youtube': './api/youtube.js',
          'ai-tutor': './api/ai-tutor.js',
          'feedback': './api/feedback.js'
        };

        const moduleRelative = handlers[endpoint];
        if (!moduleRelative) return next();

        try {
          // Parse URL search params
          const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
          req.query = Object.fromEntries(parsedUrl.searchParams.entries());

          // Buffer and parse POST JSON body if present
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            let rawBody = '';
            for await (const chunk of req) {
              rawBody += chunk;
            }
            if (rawBody.trim()) {
              try {
                req.body = JSON.parse(rawBody);
              } catch {
                req.body = rawBody;
              }
            } else {
              req.body = {};
            }
          }

          // Polyfill Express / Vercel Serverless response helpers
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };

          // Absolute file URL import to avoid .vite-temp path resolution issues
          const absolutePath = path.resolve(__dirname, moduleRelative);
          const { default: handler } = await import(pathToFileURL(absolutePath).href);
          await handler(req, res);
        } catch (err) {
          console.error(`Local Dev API Error [${endpoint}]:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal API handler error' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.YOUTUBE_API_KEY && !process.env.YOUTUBE_API_KEY) {
    process.env.YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
  }
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.RESEND_API_KEY && !process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = env.RESEND_API_KEY;
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiDevPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'logo.png', 'logo.svg'],
        manifest: {
          name: 'Foclyra · Distraction-Free Study Studio',
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
  };
});
