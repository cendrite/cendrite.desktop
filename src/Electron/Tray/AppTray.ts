import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import { getTrayIconPath } from '../Utilities.js';

export class AppTray {
    private readonly tray: Tray;
    private isQuitting = false;
    private update: { version: string; install: () => void } | undefined;
    private readonly instanceId = process.env.ELECTRON_INSTANCE_ID;
    private readonly title = this.instanceId ? `Cendrite (${this.instanceId})` : 'Cendrite';

    constructor(private readonly window: BrowserWindow) {
        this.tray = new Tray(AppTray.loadIcon());
        this.tray.setToolTip(this.title);
        this.buildMenu();
        this.tray.on('click', () => this.showWindow());
    }

    public setUpdateReady(version: string, install: () => void) {
        this.update = { version, install };
        this.buildMenu();
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

    private buildMenu() {
        const update = this.update;
        this.tray.setContextMenu(
            Menu.buildFromTemplate([
                // Linux AppIndicator trays often don't show tooltips, so label the instance in the menu too.
                ...(this.instanceId ? [{ label: this.title, enabled: false }, { type: 'separator' as const }] : []),
                { label: 'Show Cendrite', click: () => this.showWindow() },
                ...(update ? [{ label: `Restart to update to ${update.version}`, click: update.install }] : []),
                { type: 'separator' },
                { label: 'Quit', click: () => this.quit() },
            ]),
        );
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
