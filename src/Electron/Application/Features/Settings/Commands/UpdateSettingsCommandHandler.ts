import { Handler } from '#electron/Application/Mediator/Handler';
import { Result } from '#shared/Result/Result';
import { ISettingsRegistry } from '#electron/Application/Contracts/Services/ISettingsRegistry';
import { UpdateSettingsCommand } from '#shared/Settings/UpdateSettings';
import { SettingsDocument } from '#shared/Settings/SettingsDocument';
import { parseSettings } from '#electron/Application/Services/Settings/SettingsDefaults';

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
