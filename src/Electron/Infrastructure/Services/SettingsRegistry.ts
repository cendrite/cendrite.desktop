import { ISettingsRegistry } from '../../Application/Contracts/Services/ISettingsRegistry.js';
import { ISettingsRepository } from '../../Application/Contracts/Repositories/ISettingsRepository.js';
import { SettingsSection, settingsScopes } from '../../Application/Contracts/Enums/SettingsSection.js';
import { AppearanceSettingsRepository } from '../Persistence/Repositories/AppearanceSettingsRepository.js';

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
