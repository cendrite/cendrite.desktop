import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import { getTrayIconPath } from '../Utilities.js';

export class AppTray {
    private readonly tray: Tray;
    private isQuitting = false;

    constructor(private readonly window: BrowserWindow) {
        this.tray = new Tray(AppTray.loadIcon());
        const instanceId = process.env.ELECTRON_INSTANCE_ID;
        const title = instanceId ? `Cendrite (${instanceId})` : 'Cendrite';
        this.tray.setToolTip(title);
        this.tray.setContextMenu(
            Menu.buildFromTemplate([
                // Linux AppIndicator trays often don't show tooltips, so label the instance in the menu too.
                ...(instanceId ? [{ label: title, enabled: false }, { type: 'separator' as const }] : []),
                { label: 'Show Cendrite', click: () => this.showWindow() },
                { type: 'separator' },
                { label: 'Quit', click: () => this.quit() },
            ]),
        );
        this.tray.on('click', () => this.showWindow());
    }

    public get IsQuitting() {
        return this.isQuitting;
    }

    public markQuitting() {
        this.isQuitting = true;
    }

    public showWindow() {
        if (this.window.isDestroyed()) return;
        if (this.window.isMinimized()) this.window.restore();
        this.window.show();
        this.window.focus();
    }

    private quit() {
        this.markQuitting();
        app.quit();
    }

    private static loadIcon() {
        const icon = nativeImage.createFromPath(getTrayIconPath());
        if (process.platform === 'win32') return icon;
        // The source png is 1024px; trays expect small icons.
        return icon.resize({ height: process.platform === 'darwin' ? 16 : 32 });
    }
}
