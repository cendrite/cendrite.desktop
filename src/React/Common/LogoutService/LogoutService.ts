import { ErrorMessage } from "../../../Shared/Result/ErrorMessage";
import { Result } from "../../../Shared/Result/Result";
import { LogoutApi } from "../Api/Authentication/LogoutApi";
import {LogoutCommand} from "../../../Electron/Application/Features/User/Commands/Logout/LogoutCommand.ts";

export class LogoutService{
    async logout(id: string, deviceId: string): Promise<Result> {
        const logoutApi = new LogoutApi();
        console.log("Logging out user", id);
        console.log("Device id", deviceId);
        const result = await logoutApi.logout({id, deviceId});

        if(!result.success)
        {
            console.warn("Logout failed", result.errorMessage);
            return Result.fail(new ErrorMessage("LogoutError", "An error occurred while logging out."));
        }

        const localDeleteResult = await window.electron.sendRequestAsync<Result>(new LogoutCommand())

        if(!localDeleteResult.success)
        {
            console.warn("Logout failed", result.errorMessage);
            return Result.fail(new ErrorMessage("LogoutError", "An error occurred while logging out."));
        }

        return Result.success();
    }
}