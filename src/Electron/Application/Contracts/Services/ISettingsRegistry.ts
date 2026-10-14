import { ISettingsRepository } from '../Repositories/ISettingsRepository.js';
import { SettingsSection } from '../../../../Shared/Enums/SettingsSection.js';

export interface ISettingsRegistry {
    get(section: SettingsSection): ISettingsRepository;
    accountScoped(): ISettingsRepository[];
}
