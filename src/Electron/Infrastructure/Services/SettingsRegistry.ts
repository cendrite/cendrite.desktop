import { ISettingsRegistry } from '#electron/Application/Contracts/Services/ISettingsRegistry';
import { ISettingsRepository } from '#electron/Application/Contracts/Repositories/ISettingsRepository';
import { SettingsSection } from '#shared/Enums/SettingsSection';
import { settingsScopes } from '#electron/Application/Services/Settings/SettingsScope';
import { AppearanceSettingsRepository } from '../Persistence/Repositories/AppearanceSettingsRepository.js';
import { EmojiSettingsRepository } from '../Persistence/Repositories/EmojiSettingsRepository.js';
import { NotificationSettingsRepository } from '../Persistence/Repositories/NotificationSettingsRepository.js';

export class SettingsRegistry implements ISettingsRegistry {
    private readonly repositories: Record<SettingsSection, ISettingsRepository>;

    public constructor(
        appearanceSettingsRepository: AppearanceSettingsRepository,
        emojiSettingsRepository: EmojiSettingsRepository,
        notificationSettingsRepository: NotificationSettingsRepository,
    ) {
        this.repositories = {
            appearance: appearanceSettingsRepository,
            emoji: emojiSettingsRepository,
            notifications: notificationSettingsRepository,
        };
    }

    public get(section: SettingsSection): ISettingsRepository {
        return this.repositories[section];
    }

    public accountScoped(): ISettingsRepository[] {
        return (Object.keys(this.repositories) as SettingsSection[])
            .filter((section) => settingsScopes[section] === 'account')
            .map((section) => this.repositories[section]);
    }
}
