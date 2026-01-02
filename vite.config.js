// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Exponer en red local
        port: 5173,
        open: true,
        proxy: {
            '/api-dashboard': {
                target: 'https://dashboard.mechatronicstore.cl',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api-dashboard/, '')
            }
        }
    }
})
