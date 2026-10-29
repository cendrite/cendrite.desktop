import { SettingsSection } from '../Enums/SettingsSection.js';
import { SettingsDocument } from './SettingsDocument.js';

export class GetSettingsQuery implements MediatorRequest<SettingsDocument> {
    declare readonly _response?: SettingsDocument;
    public readonly type = 'GetSettingsQuery';
    constructor(public readonly section: SettingsSection) {}
}
