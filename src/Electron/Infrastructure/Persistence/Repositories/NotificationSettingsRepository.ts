import { SettingsRepositoryBase } from './SettingsRepositoryBase.js';
import { NotificationSettingsRecord } from '#electron/Domain/Entities/NotificationSettingsRecord';

export class NotificationSettingsRepository extends SettingsRepositoryBase<NotificationSettingsRecord> {
    public constructor() {
        super(NotificationSettingsRecord);
    }
}
