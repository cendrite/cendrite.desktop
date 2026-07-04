import { Result } from '../../../Shared/Result/Result';
import { UpdateAvatarCommand } from '../../../Electron/Application/Features/User/Commands/Update/Avatar/UpdateAvatarCommand.ts';
import { UpdateAvatarApi } from '../Api/UserProfile/UpdateAvatarApi.ts';
import { Media } from '../../Models/Media.ts';

export class AvatarService {
    private readonly updateAvatarApi = new UpdateAvatarApi();

    public async updateAvatar(avatar: Media | string, isStock: boolean): Promise<Result<string>> {
        const file = isStock
            ? await this.imagePathToBlob(avatar as string)
            : this.mediaToFile(avatar as Media);

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

    private mediaToFile(media: Media): File {
        return new File([media.content], 'profilePicture.png', { type: media.type });
    }

    private async imagePathToBlob(imageUrl: string): Promise<File> {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], 'profilePicture.png', { type: 'image/png' });
    }
}
