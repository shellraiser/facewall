import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/facewall/',

  server: {
    proxy: {
      // All /api/slack/* requests are forwarded to slack.com/api/*
      // with the SLACK_TOKEN injected server-side (never sent to the browser).
      '/api/slack': {
        target: 'https://slack.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/slack/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const token = process.env.SLACK_TOKEN;
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }
          });
        },
      },
    },
  },
})
