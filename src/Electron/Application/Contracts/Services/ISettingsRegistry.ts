import { ISettingsRepository } from '../Repositories/ISettingsRepository.js';
import { SettingsSection } from '#shared/Enums/SettingsSection';

export interface ISettingsRegistry {
    get(section: SettingsSection): ISettingsRepository;
    accountScoped(): ISettingsRepository[];
}
