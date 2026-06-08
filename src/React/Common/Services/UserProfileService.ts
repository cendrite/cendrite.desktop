import { GetUserProfileApi } from '../Api/UserProfile/GetUserProfileApi';
import { Result } from '../../../Shared/Result/Result.ts';
import { CreateUserDto } from '../../../Electron/Application/Features/User/Commands/Create/CreateUserDto.ts';
import { CreateUserCommand } from '../../../Electron/Application/Features/User/Commands/Create/CreateUserCommand.ts';

export class UserProfileService {
    private readonly getUserProfileApi = new GetUserProfileApi();

    public async HandleUserProfile(exclusiveConnectionId: string) {
        const getUserProfileResult = await this.getUserProfileApi.getUserProfile({ exclusiveConnectionId });

        if (!getUserProfileResult.success) {
            console.error(getUserProfileResult.errorMessage);
            return null;
            // TODO: Handle fatal error here
        }

        const result = await window.electron.sendRequestAsync<Result<CreateUserDto>>(
            new CreateUserCommand(
                getUserProfileResult.data!.id,
                getUserProfileResult.data!.username,
                getUserProfileResult.data!.userTag,
                getUserProfileResult.data!.connectionIds,
                getUserProfileResult.data!.avatarKey,
                getUserProfileResult.data!.displayName,
            ),
        );

        if (!result.success) {
            console.log('Error creating user');
            console.error(result.errorMessage);
            return null;
            //this would be fatal error.
        }

        return result.data;
    }
}
