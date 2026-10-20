import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const port = Number(process.env.PORT) || 8080;

const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "img-src 'self' blob: https://conduit.xhykl49jkg.org",
    "media-src blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
    return {
        name: 'content-security-policy',
        apply: 'build',
        transformIndexHtml: () => [
            {
                tag: 'meta',
                attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
                injectTo: 'head-prepend',
            },
        ],
    };
}

export default defineConfig({
    plugins: [react(), contentSecurityPolicy()],
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
