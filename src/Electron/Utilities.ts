import { app } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';

export function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}

export function isSpawnDevelopment() {
    return process.env.NODE_ENV === 'spawn-development';
}

export function getAppUrl(): string {
    if (isDevelopment() || isSpawnDevelopment()) {
        return `http://localhost:${process.env.VITE_PORT || '8080'}/`;
    }

    return pathToFileURL(path.join(app.getAppPath(), './dist-react/index.html')).href;
}

export function isAppUrl(url: string): boolean {
    try {
        const target = new URL(url);
        const appUrl = new URL(getAppUrl());
        return target.protocol === appUrl.protocol && target.host === appUrl.host && target.pathname === appUrl.pathname;
    } catch {
        return false;
    }
}

export function getPreloadPath() {
    if (isSpawnDevelopment()) {
        return path.resolve(process.cwd(), 'dist-electron/Electron/Preload.cjs');
    } else {
        return path.resolve(app.getAppPath(), isDevelopment() ? './' : '../', 'dist-electron/Electron/Preload.cjs');
    }
}
