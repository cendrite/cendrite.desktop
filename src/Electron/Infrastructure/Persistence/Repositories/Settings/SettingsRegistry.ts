import { ISettingsRegistry } from '../../../../Application/Contracts/Settings/ISettingsRegistry.js';
import { ISettingsRepository } from '../../../../Application/Contracts/Repositories/ISettingsRepository.js';
import { SettingsSection, settingsScopes } from '../../../../Application/Contracts/Settings/SettingsSection.js';
import { AppearanceSettingsRepository } from './AppearanceSettingsRepository.js';

export class SettingsRegistry implements ISettingsRegistry {
    private readonly repositories: Record<SettingsSection, ISettingsRepository>;

    public constructor(appearanceSettingsRepository: AppearanceSettingsRepository) {
        this.repositories = {
            appearance: appearanceSettingsRepository,
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
