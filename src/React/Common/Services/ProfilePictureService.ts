import { Result } from "../../../Shared/Result/Result";
import { UpdateProfilePictureApi } from "../Api/UserProfile/UpdateProfilePictureApi";
import {
    UpdateProfilePictureCommand
} from "../../../Electron/Application/Features/User/Commands/Update/ProfilePicture/UpdateProfilePictureCommand.ts";
import {GetUserProfilePictureApi} from "../Api/UserProfile/GetUserProfilePicture.ts";


export class ProfilePictureService {
    private readonly updateProfilePictureApi = new UpdateProfilePictureApi();
    private readonly pictureApi = new GetUserProfilePictureApi();
    public async updateProfilePicture(profilePicture: string, isStock: boolean): Promise<Result> {
        let file: File | null
        let base64: string | null

        if(isStock){
            file = await this.imagePathToBlob(profilePicture);
            base64 = await this.convertToBase64(file);
        }else{
            file = this.base64ToFile(profilePicture, "profilePicture.png")
            base64 = profilePicture
        }

        const remoteUpdateResult = await this.updateProfilePictureApi.updateProfilePicture({ ProfilePicture: file });

        if(!remoteUpdateResult.success){
            return Result.fail(remoteUpdateResult.errorMessage!);
        }

        const localUpdateResult = await window.electron.sendRequestAsync<Result>(new UpdateProfilePictureCommand(base64));

        if(!localUpdateResult.success){
            return Result.fail(localUpdateResult.errorMessage!);
        }

        return Result.success();
    }

    public async FetchProfilePicture(url: string): Promise<string | null> {
        if (!url) return null;
        try {
            const profilePictureResult =
                await this.pictureApi.getUserProfilePicture({profilePictureUrl: url});

            if (!profilePictureResult.success) {
                console.error(profilePictureResult.errorMessage);
                return null;
            }

            return profilePictureResult.data?.base64ProfilePicture ?? null;
        } catch (err) {
            console.error("Failed to fetch profile picture:", err);
            return null;
        }
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

    private async convertToBase64(file: File): Promise<string>{
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
}