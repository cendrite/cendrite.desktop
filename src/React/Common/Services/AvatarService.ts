import { Result } from '../../../Shared/Result/Result';
import { UpdateProfilePictureApi as UpdateAvatarApi } from '../Api/UserProfile/UpdateProfilePictureApi';
import { GetUserProfilePictureApi } from '../Api/UserProfile/GetUserProfilePicture.ts';
import { UpdateAvatarCommand } from '../../../Electron/Application/Features/User/Commands/Update/Avatar/UpdateAvatarCommand.ts';

export class AvatarService {
    private readonly updateAvatarApi = new UpdateAvatarApi();
    private readonly pictureApi = new GetUserProfilePictureApi();

    public async updateAvatar(avatar: string, isStock: boolean): Promise<Result<string>> {
        let file: File | null;

        if (isStock) {
            file = await this.imagePathToBlob(avatar);
        } else {
            file = this.base64ToFile(avatar, 'profilePicture.png');
        }

        const remoteUpdateResult = await this.updateAvatarApi.handle({ Avatar: file });

        if (!remoteUpdateResult.success) {
            return Result.fail<string>(remoteUpdateResult.errorMessage!);
        }

        const localUpdateResult = await window.electron.sendRequestAsync<Result>(
            new UpdateAvatarCommand(remoteUpdateResult.data!.AvatarKey),
        );

        if (!localUpdateResult.success) {
            return Result.fail<string>(localUpdateResult.errorMessage!);
        }

        return Result.success(remoteUpdateResult.data!.AvatarKey);
    }

    public async FetchProfilePicture(avatar_key: string): Promise<string | null> {
        if (!avatar_key) return null;
        try {
            const profilePictureResult = await this.pictureApi.getUserProfilePicture({ profilePictureUrl: avatar_key });

            if (!profilePictureResult.success) {
                console.error(profilePictureResult.errorMessage);
                return null;
            }

            return profilePictureResult.data?.base64ProfilePicture ?? null;
        } catch (err) {
            console.error('Failed to fetch profile picture:', err);
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

    private async imagePathToBlob(imageUrl: string): Promise<File> {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], 'profilePicture.png', { type: 'image/png' });
    }
}
