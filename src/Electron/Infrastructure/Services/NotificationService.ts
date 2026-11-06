import { BrowserWindow, Notification } from 'electron';
import { INotificationService } from '#electron/Application/Contracts/Services/INotificationService';
import { parseSettings } from '#electron/Application/Services/Settings/SettingsDefaults';
import { NotificationSettings } from '#shared/Settings/NotificationSettings';
import { NotificationSettingsRepository } from '../Persistence/Repositories/NotificationSettingsRepository.js';
import { AppTray } from '../../Tray/AppTray.js';
import { getTrayIconPath } from '../../Utilities.js';

export class NotificationService implements INotificationService {
    private readonly active = new Set<Notification>();

    constructor(
        private readonly mainWindow: BrowserWindow,
        private readonly appTray: AppTray,
        private readonly notificationSettingsRepository: NotificationSettingsRepository,
    ) {}

    public notifyDeviceAdded(platform: string): void {
        if (!Notification.isSupported() || this.mainWindow.isDestroyed() || this.mainWindow.isFocused()) return;

        this.show('New device added', `A ${platform} device was added to your account. Not you? Open Cendrite to review your devices.`);
    }

    public async notifyMessage(title: string, preview: string): Promise<void> {
        if (this.mainWindow.isDestroyed() || this.mainWindow.isFocused()) return;

        const settings = parseSettings(
            'notifications',
            await this.notificationSettingsRepository.get(),
        ) as NotificationSettings;
        if (!settings.enabled) return;

        const body = settings.showMessagePreview ? preview : 'New message';

        this.show(title, body);
    }

    private show(title: string, body: string): void {
        const notification = new Notification({ title, body, icon: getTrayIconPath() });
        this.active.add(notification);

        notification.on('click', () => {
            this.active.delete(notification);
            this.appTray.showWindow();
        });
        notification.on('close', () => this.active.delete(notification));

        notification.show();
    }
}
