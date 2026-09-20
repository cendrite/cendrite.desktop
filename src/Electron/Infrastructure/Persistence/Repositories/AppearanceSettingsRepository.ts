import { SettingsRepositoryBase } from './SettingsRepositoryBase.js';
import { AppearanceSettingsRecord } from '../../../Domain/Entities/AppearanceSettingsRecord.js';

export class AppearanceSettingsRepository extends SettingsRepositoryBase<AppearanceSettingsRecord> {
    public constructor() {
        super(AppearanceSettingsRecord);
    }
}
