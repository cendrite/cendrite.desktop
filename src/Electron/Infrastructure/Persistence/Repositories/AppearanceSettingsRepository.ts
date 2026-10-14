import { SettingsRepositoryBase } from './SettingsRepositoryBase.js';
import { AppearanceSettingsRecord } from '#electron/Domain/Entities/AppearanceSettingsRecord';

export class AppearanceSettingsRepository extends SettingsRepositoryBase<AppearanceSettingsRecord> {
    public constructor() {
        super(AppearanceSettingsRecord);
    }
}
