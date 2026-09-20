import { SettingsSection } from '../../../Contracts/Settings/SettingsSection.js';
import { SettingsDocument } from '../SettingsDocument.js';

export class UpdateSettingsCommand implements MediatorRequest {
    public readonly type = 'UpdateSettingsCommand';
    constructor(
        public readonly section: SettingsSection,
        public readonly patch: SettingsDocument,
    ) {}
}
