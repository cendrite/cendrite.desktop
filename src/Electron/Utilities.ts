import { app } from 'electron';
import path from 'path';

export function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}

export function isSpawnDevelopment() {
    return process.env.NODE_ENV === 'spawn-development';
}

export function getPreloadPath() {
    if (isSpawnDevelopment()) {
        return path.resolve(process.cwd(), 'dist-electron/Electron/Preload.cjs');
    } else {
        return path.resolve(app.getAppPath(), isDevelopment() ? './' : '../', 'dist-electron/Electron/Preload.cjs');
    }
}
