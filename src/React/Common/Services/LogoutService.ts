import { ErrorMessage } from "../../../Shared/Result/ErrorMessage";
import { Result } from "../../../Shared/Result/Result";
import {LogoutCommand} from "../../../Electron/Application/Features/User/Commands/Logout/LogoutCommand.ts";
import {LogoutApi} from "../Api/Identity/Auth/LogoutApi.ts";
import {SignalManager} from "../../SignalR/SignalManager.ts";
import {TokenManager} from "../../Security/Tokens/TokenManager.ts";

export class LogoutService{
    async logout(): Promise<Result> {

        const logoutApi = new LogoutApi();
        const result = await logoutApi.logout();

        if(!result.success)
            console.warn("Backend logout failed", result.errorMessage);

        TokenManager.getInstance().disableAndClear();
        await SignalManager.getInstance().disconnect();

        const localDeleteResult = await window.electron.sendRequestAsync<Result>(new LogoutCommand())

        if(!localDeleteResult.success)
        {
            console.warn("Logout failed", result.errorMessage);
            return Result.fail(new ErrorMessage("LogoutError", "An error occurred while logging out."));
        }

        return Result.success();
    }
}
