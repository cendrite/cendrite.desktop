import { Handler } from '#electron/Application/Mediator/Handler';
import { Result } from '#shared/Result/Result';
import { ISettingsRegistry } from '#electron/Application/Contracts/Services/ISettingsRegistry';
import { SettingsDocument } from '#shared/Settings/SettingsDocument';
import { GetSettingsQuery } from '#shared/Settings/GetSettings';
import { parseSettings } from '#electron/Application/Services/Settings/SettingsDefaults';

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
