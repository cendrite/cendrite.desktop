import { app } from "electron";
import path from "path";

export function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}

export function getPreloadPath() {
    return path.resolve(
        app.getAppPath(),
        isDevelopment() ? './' : '../',
        'dist-electron/Electron/Preload.cjs'
    )
}