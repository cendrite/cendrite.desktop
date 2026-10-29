import { SettingsRepositoryBase } from './SettingsRepositoryBase.js';
import { EmojiSettingsRecord } from '#electron/Domain/Entities/EmojiSettingsRecord';

export class EmojiSettingsRepository extends SettingsRepositoryBase<EmojiSettingsRecord> {
    public constructor() {
        super(EmojiSettingsRecord);
    }
}
