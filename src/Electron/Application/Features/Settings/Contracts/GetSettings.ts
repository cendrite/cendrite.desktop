import { SettingsSection } from '../../../Contracts/Enums/SettingsSection.js';

export class GetSettingsQuery implements MediatorRequest {
    public readonly type = 'GetSettingsQuery';
    constructor(public readonly section: SettingsSection) {}
}
