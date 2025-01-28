import {Result} from "../../../../Shared/Result/Result.ts";
import {CreateUserDto} from "../../../../Electron/Application/Features/User/Commands/Create/CreateUserDto.ts";
import {CreateUserCommand} from "../../../../Electron/Application/Features/User/Commands/Create/CreateUserCommand.ts";
import {GetUserProfileApi} from "../../../Common/Api/UserProfile/GetUserProfileApi.ts";

export class UserProfileService {
    private readonly getUserProfileApi = new GetUserProfileApi();
    public async HandleUserProfile(userId: string){
        const getUserProfileResult  = await this.getUserProfileApi.getUserProfile({ userProfileId: userId });

        if(!getUserProfileResult.success){
            console.error(getUserProfileResult.errorMessage);
            return null;
            //this would be fatal error.
            // TODO: Handle fatal error here
        }

        const result = await window.electron.sendRequestAsync<Result<CreateUserDto>>(
            new CreateUserCommand(
                getUserProfileResult.data!.id,
                getUserProfileResult.data!.username,
                getUserProfileResult.data!.userTag,
                // Todo: make this null if it is empty string or undefined
                getUserProfileResult.data?.profilePictureUrl,
                getUserProfileResult.data?.displayName
            ));

        if(!result.success){
            console.error(result.errorMessage);
            return null;
            //this would be fatal error.
        }

        return result.data;
    }
}
