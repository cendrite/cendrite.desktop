import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const port = Number(process.env.PORT) || 8080;

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '#shared': fileURLToPath(new URL('./src/Shared', import.meta.url)),
            '#electron': fileURLToPath(new URL('./src/Electron', import.meta.url)),
        },
    },
    base: './',
    build: {
        outDir: 'dist-react'
    },
    server: {
        port: port,
        strictPort: true,
    }
})
