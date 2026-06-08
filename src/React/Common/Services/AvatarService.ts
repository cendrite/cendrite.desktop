import { Result } from '../../../Shared/Result/Result';
import { UpdateAvatarCommand } from '../../../Electron/Application/Features/User/Commands/Update/Avatar/UpdateAvatarCommand.ts';
import { UpdateAvatarApi } from '../Api/UserProfile/UpdateAvatarApi.ts';

export class AvatarService {
    private readonly updateAvatarApi = new UpdateAvatarApi();

    public async updateAvatar(avatar: string, isStock: boolean): Promise<Result<string>> {
        let file: File | null;

        if (isStock) {
            file = await this.imagePathToBlob(avatar);
        } else {
            file = this.base64ToFile(avatar, 'profilePicture.png');
        }

        const remoteUpdateResult = await this.updateAvatarApi.handle({ Avatar: file });

        console.log('Remote update result:', remoteUpdateResult);
        if (!remoteUpdateResult.success) {
            return Result.fail<string>(remoteUpdateResult.errorMessage!);
        }

        const localUpdateResult = await window.electron.sendRequestAsync<Result>(
            new UpdateAvatarCommand(remoteUpdateResult.data!.fileKey),
        );

        if (!localUpdateResult.success) {
            return Result.fail<string>(localUpdateResult.errorMessage!);
        }

        return Result.success(remoteUpdateResult.data!.fileKey);
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
