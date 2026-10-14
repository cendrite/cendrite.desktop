import { Handler } from '../../../Mediator/Handler.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { ISettingsRegistry } from '../../../Contracts/Services/ISettingsRegistry.js';
import { UpdateSettingsCommand } from '../../../../../Shared/Contracts/Settings/UpdateSettings.js';
import { SettingsDocument } from '../../../../../Shared/Contracts/Settings/SettingsDocument.js';
import { parseSettings } from '../SettingsDefaults.js';

export class UpdateSettingsCommandHandler implements Handler<UpdateSettingsCommand, SettingsDocument> {
    private readonly settingsRegistry: ISettingsRegistry;

    constructor(settingsRegistry: ISettingsRegistry) {
        this.settingsRegistry = settingsRegistry;
    }

    public async handle(request: UpdateSettingsCommand): Promise<Result<SettingsDocument>> {
        const repository = this.settingsRegistry.get(request.section);

        const current = parseSettings(request.section, await repository.get());
        const updated = { ...current, ...request.patch };

        await repository.set(JSON.stringify(updated));

        return Result.success(updated);
    }
}
