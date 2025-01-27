import {LogoutCommand} from "./LogoutCommand.js";
import {Result} from "../../../../../../Shared/Result/Result.js";
import {Handler} from "../../../../Mediator/Handler.js";
import { UserRepository } from "../../../../../Persistence/Repositories/UserRepository.js";
import {DeviceRepository} from "../../../../../Persistence/Repositories/DeviceRepository.js";
import {RefreshTokenRepository} from "../../../../../Persistence/Repositories/RefreshTokenRepository.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import {LogoutManager} from "../../../../Services/LogoutManager/LogoutManager.js";

export class LogoutCommandHandler implements Handler<LogoutCommand, void> {

    public async handle(request: LogoutCommand): Promise<Result> {

        try {
            const logoutManager = LogoutManager.getInstance();
            logoutManager.startLogout();
            console.log("started logout: ", logoutManager.IsLoggingOut);

            // Add a delay for 3 seconds
            await new Promise(resolve => setTimeout(resolve, 10000));

            const userRepo = new UserRepository();
            const deviceRepo = new DeviceRepository();
            const refreshTokenRepo = new RefreshTokenRepository();

            await userRepo.delete();
            await deviceRepo.delete();
            await refreshTokenRepo.delete();

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