import { Result } from '../../../../../Shared/Result/Result.js';
import { ITokenManager } from '../../../Contracts/Services/ITokenManager.js';
import { ISignalManager } from '../../../Contracts/Services/ISignalManager.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { IPurgeLocalData } from '../../../Contracts/Services/IPurgeLocalData.js';
import { LogoutManager } from '../../../Services/LogoutManager/LogoutManager.js';
import { LogoutCommand } from '../Contracts/Logout.js';

export class LogoutCommandHandler implements Handler<LogoutCommand, void> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly tokenManager: ITokenManager,
        private readonly logoutManager: LogoutManager,
        private readonly purgeLocalDataService: IPurgeLocalData,
        private readonly outboxPump: IPump,
        private readonly deliveryStatusUpdatePump: IPump,
        private readonly signalManager: ISignalManager
    ) { }

    public async handle(_cmd: LogoutCommand): Promise<Result<void>> {
        if (this.logoutManager.IsLoggingOut) {
            console.log('LogoutCommandHandler.handle: Logout already in progress, ignoring');
            return Result.success();
        }

        this.outboxPump.stop();
        this.deliveryStatusUpdatePump.stop();

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
