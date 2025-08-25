import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = Number(process.env.PORT) || 8080;

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist-react'
    },
    server: {
        port: port,
        strictPort: true,
    }
})
