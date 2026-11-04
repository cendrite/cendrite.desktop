import { app, Notification } from 'electron';
import electronUpdater from 'electron-updater';
import { AppTray } from '../Tray/AppTray.js';
import { getTrayIconPath } from '../Utilities.js';

const { autoUpdater } = electronUpdater;

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

export class AppUpdater {
    private notification: Notification | undefined;

    constructor(private readonly tray: AppTray) {}

    public start() {
        if (!app.isPackaged || process.platform === 'darwin') return;

        autoUpdater.on('update-downloaded', ({ version }) => this.onDownloaded(version));
        autoUpdater.on('error', (err) => console.error('Update failed', err));

        this.check();
        setInterval(() => this.check(), CHECK_INTERVAL_MS);
    }

    private check() {
        autoUpdater.checkForUpdates().catch(() => {});
    }

    private onDownloaded(version: string) {
        this.tray.setUpdateReady(version, () => this.install());

        if (!Notification.isSupported()) return;

        this.notification = new Notification({
            title: `Cendrite ${version} is ready`,
            body: 'Click to restart and update.',
            icon: getTrayIconPath(),
        });
        this.notification.on('click', () => this.install());
        this.notification.show();
    }

    private install() {
        this.tray.markQuitting();
        autoUpdater.quitAndInstall();
    }
}
