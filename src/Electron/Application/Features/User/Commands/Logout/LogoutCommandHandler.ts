import {LogoutCommand} from "./LogoutCommand.js";
import {Result} from "../../../../../../Shared/Result/Result.js";
import {Handler} from "../../../../Mediator/Handler.js";
import { UserRepository } from "../../../../../Persistence/Repositories/UserRepository.js";
import {DeviceRepository} from "../../../../../Persistence/Repositories/DeviceRepository.js";
import {RefreshTokenRepository} from "../../../../../Persistence/Repositories/RefreshTokenRepository.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import {LogoutManager} from "../../../../Services/LogoutManager/LogoutManager.js";
import { PurgeLocalDataService } from "../../../../Services/Data/PurgeLocalDataService.js";

export class LogoutCommandHandler implements Handler<LogoutCommand, void> {

    public async handle(request: LogoutCommand): Promise<Result> {

        try {
            const logoutManager = LogoutManager.getInstance();
            logoutManager.startLogout();
            console.log("started logout: ", logoutManager.IsLoggingOut);

            const purger = new PurgeLocalDataService();
            await purger.purgeLocalData();

            logoutManager.endLogout();
            console.log("ended logout: ", logoutManager.IsLoggingOut);

            return Result.success();
        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Logout Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Logout Failed"));
        }
    }
}