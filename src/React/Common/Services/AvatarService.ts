import { Result } from '../../../Shared/Result/Result';
import { UpdateAvatarCommand } from '../../../Electron/Application/Features/User/Contracts/UpdateAvatarCommand.ts';
import { Media } from '../../Models/Media.ts';

export class AvatarService {
    public async updateAvatar(avatar: Media | string, isStock: boolean): Promise<Result<string>> {
        const { bytes, mimeType } = isStock
            ? await this.imagePathToBytes(avatar as string)
            : { bytes: (avatar as Media).content, mimeType: (avatar as Media).type };

        const localUpdateResult = await window.electron.sendRequestAsync<Result<string>>(
            new UpdateAvatarCommand(bytes, mimeType, 'profilePicture.png'),
        );

        if (!localUpdateResult.success) {
            return Result.fail<string>(localUpdateResult.errorMessage!);
        }

        return Result.success(localUpdateResult.data!);
    }

    private async imagePathToBytes(imageUrl: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        return { bytes: new Uint8Array(buffer), mimeType: 'image/png' };
    }
}
