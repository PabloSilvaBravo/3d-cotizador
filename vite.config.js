// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],

    // Optimizaciones de build para producción
    build: {
        // Minificación con terser para mejor compresión
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Eliminar console.logs en producción
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info'], // Eliminar funciones específicas
            },
        },

        // Chunk splitting manual para mejor caching
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separar vendors grandes
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
                    'motion-vendor': ['framer-motion'],
                },
                // Nombres de chunks con hash para cache busting
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            },
        },

        // Optimizaciones adicionales
        cssCodeSplit: true, // Separar CSS por chunk
        sourcemap: false, // No generar sourcemaps en producción
        reportCompressedSize: true, // Reportar tamaño comprimido
        chunkSizeWarningLimit: 1000, // Advertir si chunks > 1MB

        // Optimización de assets
        assetsInlineLimit: 4096, // Inline assets < 4KB como base64
    },

    // Optimizaciones de desarrollo
    server: {
        host: true,
        port: 5173,
        open: true,

        // HMR más rápido
        hmr: {
            overlay: true,
        },

        proxy: {
            '/api-dashboard': {
                target: 'https://dashboard.mechatronicstore.cl',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api-dashboard/, '')
            }
        }
    },

    // Optimizaciones de dependencias
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            'framer-motion'
        ],
    },
})
