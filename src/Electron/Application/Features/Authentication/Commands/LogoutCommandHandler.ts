import { Result } from '../../../../../Shared/Result/Result.js';
import { TokenManager } from '../../../../Infrastructure/Services/TokenManager.js';
import { IAuthenticationProvider } from '../../../Contracts/Providers/IAuthenticationProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { PurgeLocalDataService } from '../../../Services/Data/PurgeLocalDataService.js';
import { LogoutManager } from '../../../Services/LogoutManager/LogoutManager.js';
import { LogoutCommand } from '../Contracts/Logout.js';

export class LogoutCommandHandler implements Handler<LogoutCommand, void> {
    constructor(
        private readonly authenticationProvider: IAuthenticationProvider,
        private readonly tokenManager: TokenManager,
        private readonly logoutManager: LogoutManager,
    ) { }

    public async handle(_cmd: LogoutCommand): Promise<Result<void>> {
        this.logoutManager.startLogout();

        console.log('LogoutCommandHandler.handle: Logging out user');

        await this.authenticationProvider.logout();

        const purger = new PurgeLocalDataService();
        await purger.purgeLocalData();
        this.tokenManager.disableAndClear();
        
        this.logoutManager.endLogout();

        console.log('LogoutCommandHandler.handle: User logged out successfully');

        return Result.success();
    }
}
