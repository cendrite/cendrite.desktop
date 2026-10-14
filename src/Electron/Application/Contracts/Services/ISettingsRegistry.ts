import { ISettingsRepository } from '../Repositories/ISettingsRepository.js';
import { SettingsSection } from '../../../../Shared/Contracts/Enums/SettingsSection.js';

export interface ISettingsRegistry {
    get(section: SettingsSection): ISettingsRepository;
    accountScoped(): ISettingsRepository[];
}
