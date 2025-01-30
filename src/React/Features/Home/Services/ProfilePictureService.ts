import {Result} from "../../../../Shared/Result/Result.ts";
import { UpdateProfilePictureApi } from "../../../Common/Api/UserProfile/UpdateProfilePictureApi.ts";
import {
    UpdateProfilePictureCommand
} from "../../../../Electron/Application/Features/User/Commands/Update/ProfilePicture/UpdateProfilePictureCommand.ts";

export class ProfilePictureService {
    private readonly updateProfilePictureApi = new UpdateProfilePictureApi();

    public async updateProfilePicture(id: string, profilePicture: string): Promise<Result> {
        const remoteUpdateResult = await this.updateProfilePictureApi.updateProfilePicture(
            {Id: id, NewProfilePicture: profilePicture });

        if(!remoteUpdateResult.success){
            return Result.fail(remoteUpdateResult.errorMessage!);
        }

        const localUpdateResult = await window.electron.sendRequestAsync<Result>(new UpdateProfilePictureCommand(profilePicture));

        if(!localUpdateResult.success){
            return Result.fail(localUpdateResult.errorMessage!);
        }

        return Result.success();
    }
}