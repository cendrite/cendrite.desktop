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

/** Prefix for group and ledger logs, so the three dev instances can be told apart in one stream. */
export function tag(): string {
    return `[i${process.env.ELECTRON_INSTANCE_ID ?? '?'}]`;
}

export function short(value: Buffer | string | null | undefined): string {
    if (!value) return 'none';
    const hex = typeof value === 'string' ? value : value.toString('hex');
    return hex.slice(0, 8);
}
