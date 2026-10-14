import { SettingsSection } from '../Enums/SettingsSection.js';
import { SettingsDocument } from './SettingsDocument.js';

export class UpdateSettingsCommand implements MediatorRequest<SettingsDocument> {
    declare readonly _response?: SettingsDocument;
    public readonly type = 'UpdateSettingsCommand';
    constructor(
        public readonly section: SettingsSection,
        public readonly patch: SettingsDocument,
    ) {}
}
