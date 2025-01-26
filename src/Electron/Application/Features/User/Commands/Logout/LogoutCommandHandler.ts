import {LogoutCommand} from "./LogoutCommand.js";
import {Result} from "../../../../../../Shared/Result/Result.js";
import {Handler} from "../../../../Mediator/Handler.js";
import {LogoutManager} from "../../../Services/LogoutManager.js";
import { UserRepository } from "../../../../../Persistence/Repositories/UserRepository.js";
import {DeviceRepository} from "../../../../../Persistence/Repositories/DeviceRepository.js";
import {RefreshTokenRepository} from "../../../../../Persistence/Repositories/RefreshTokenRepository.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";

export class LogoutCommandHandler implements Handler<LogoutCommand, void> {

    public async handle(request: LogoutCommand): Promise<Result> {

        try {
            const logoutManager = LogoutManager.getInstance();
            logoutManager.IsLoggingOut = true;

            const userRepo = new UserRepository();
            const deviceRepo = new DeviceRepository();
            const refreshTokenRepo = new RefreshTokenRepository();

            await userRepo.delete();
            await deviceRepo.delete();
            await refreshTokenRepo.delete();

            logoutManager.IsLoggingOut = false;
            return Result.success();
        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Logout Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Logout Failed"));
        }
    }
}