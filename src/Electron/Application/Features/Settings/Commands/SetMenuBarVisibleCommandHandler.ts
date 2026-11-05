import { BrowserWindow } from 'electron';
import { Handler } from '#electron/Application/Mediator/Handler';
import { Result } from '#shared/Result/Result';
import { ISettingsRegistry } from '#electron/Application/Contracts/Services/ISettingsRegistry';
import { SetMenuBarVisibleCommand } from '#shared/Settings/SetMenuBarVisible';
import { parseSettings } from '#electron/Application/Services/Settings/SettingsDefaults';

export class SetMenuBarVisibleCommandHandler implements Handler<SetMenuBarVisibleCommand, void> {
    constructor(
        private readonly settingsRegistry: ISettingsRegistry,
        private readonly mainWindow: BrowserWindow,
    ) {}

    public async handle(request: SetMenuBarVisibleCommand): Promise<Result<void>> {
        const repository = this.settingsRegistry.get('appearance');
        const current = parseSettings('appearance', await repository.get());

        await repository.set(JSON.stringify({ ...current, showMenuBar: request.visible }));

        if (!this.mainWindow.isDestroyed()) this.mainWindow.setMenuBarVisibility(request.visible);

        return Result.success();
    }
}
