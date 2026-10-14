import { Handler } from '../../../Mediator/Handler.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { ISettingsRegistry } from '../../../Contracts/Services/ISettingsRegistry.js';
import { GetSettingsQuery } from '../Contracts/GetSettings.js';
import { SettingsDocument } from '../../../../../Shared/Contracts/Settings/SettingsDocument.js';
import { parseSettings } from '../SettingsDefaults.js';

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
