import {Result} from "../../../../Shared/Result/Result.ts";
import { UpdateProfilePictureApi } from "../../../Common/Api/UserProfile/UpdateProfilePictureApi.ts";
import {UpdateProfilePictureCommand} from "../../../../Electron/Application/Features/User/Commands/Update/ProfilePicture/UpdateProfilePictureCommand.ts";

export class ProfilePictureService {
    private readonly updateProfilePictureApi = new UpdateProfilePictureApi();

    public async updateProfilePicture(id: string, profilePicture: string, isStock: boolean): Promise<Result> {
        let file: File | null

        if(isStock){
            file = await this.imagePathToBlob(profilePicture);
        }else{
            file = this.base64ToFile(profilePicture, "profilePicture.png");
        }

        const remoteUpdateResult = await this.updateProfilePictureApi.updateProfilePicture(
            {Id: id, NewProfilePicture: file });

        if(!remoteUpdateResult.success){
            return Result.fail(remoteUpdateResult.errorMessage!);
        }

        const localUpdateResult = await window.electron.sendRequestAsync<Result>(new UpdateProfilePictureCommand(profilePicture));

        if(!localUpdateResult.success){
            return Result.fail(localUpdateResult.errorMessage!);
        }

        return Result.success();
    }

    private base64ToFile(base64Data: string, fileName: string): File {

        const matches = base64Data.match(/^data:(.+);base64,(.*)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 format');
        }

        const mimeType = matches[1];
        const byteCharacters = atob(matches[2]);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new File([byteArray], fileName, { type: mimeType });
    }

    private async imagePathToBlob(imageUrl: string) : Promise<File>{
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], "profilePicture.png", { type: "image/png" });
    }
}