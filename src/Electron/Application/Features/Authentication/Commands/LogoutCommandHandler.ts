import { Result } from '#shared/Result/Result';
import { ITokenManager } from '#electron/Application/Contracts/Services/ITokenManager';
import { ISignalManager } from '#electron/Application/Contracts/Services/ISignalManager';
import { IAuthenticationProvider } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IPurgeLocalData } from '#electron/Application/Contracts/Services/IPurgeLocalData';
import { LogoutManager } from '#electron/Application/Services/LogoutManager/LogoutManager';
import { LogoutCommand } from '#shared/Authentication/Logout';

export class LogoutCommandHandler implements Handler<LogoutCommand, void> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly tokenManager: ITokenManager,
        private readonly logoutManager: LogoutManager,
        private readonly purgeLocalDataService: IPurgeLocalData,
        private readonly messagePump: IPump,
        private readonly deliveryStatusUpdatePump: IPump,
        private readonly preKeyPump: IPump,
        private readonly signalManager: ISignalManager
    ) { }

    public async handle(_cmd: LogoutCommand): Promise<Result<void>> {
        if (this.logoutManager.IsLoggingOut) {
            console.log('LogoutCommandHandler.handle: Logout already in progress, ignoring');
            return Result.success();
        }

        this.messagePump.stop();
        this.deliveryStatusUpdatePump.stop();
        this.preKeyPump.stop();

        this.logoutManager.startLogout();

        console.log('LogoutCommandHandler.handle: Logging out user');

        try {
            const remoteResult = await this.authenticationProvider.logout();
            if (remoteResult.success === false)
                console.error('LogoutCommandHandler.handle: Remote logout failed', remoteResult.errorMessage);
        } finally {
            await this.purgeLocalDataService.purgeLocalData();

            this.signalManager.disconnect();
            this.tokenManager.disableAndClear();
            this.logoutManager.endLogout();
        }

        console.log('LogoutCommandHandler.handle: User logged out successfully');

        return Result.success();
    }
}
