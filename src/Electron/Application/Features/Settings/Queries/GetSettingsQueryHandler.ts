import { Handler } from '#electron/Application/Mediator/Handler';
import { Result } from '#shared/Result/Result';
import { ISettingsRegistry } from '#electron/Application/Contracts/Services/ISettingsRegistry';
import { SettingsSection } from '#shared/Enums/SettingsSection';
import { SettingsDocument } from '#shared/Settings/SettingsDocument';
import { parseSettings } from '../SettingsDefaults.js';

export class GetSettingsQuery implements MediatorRequest<SettingsDocument> {
    declare readonly _response?: SettingsDocument;
    public readonly type = 'GetSettingsQuery';
    constructor(public readonly section: SettingsSection) {}
}

export class GetSettingsQueryHandler implements Handler<GetSettingsQuery, SettingsDocument> {
    private readonly settingsRegistry: ISettingsRegistry;

    constructor(settingsRegistry: ISettingsRegistry) {
        this.settingsRegistry = settingsRegistry;
    }

    public async handle(request: GetSettingsQuery): Promise<Result<SettingsDocument>> {
        const stored = await this.settingsRegistry.get(request.section).get();

        return Result.success(parseSettings(request.section, stored));
    }
}
