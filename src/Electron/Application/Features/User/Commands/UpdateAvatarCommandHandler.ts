import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { IUserProvider } from '#electron/Application/Contracts/Providers/IUserProvider';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { UpdateAvatarCommand } from '#shared/User/UpdateAvatar';

export class UpdateAvatarCommandHandler implements Handler<UpdateAvatarCommand, string> {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userProvider: IUserProvider,
    ) { }

    public async handle(cmd: UpdateAvatarCommand): Promise<Result<string>> {
        const user = await this.userRepository.get(false);

        const remoteResult = await this.userProvider.updateAvatar({
            bytes: cmd.bytes,
            mimeType: cmd.mimeType,
            fileName: cmd.fileName,
        });

        if (remoteResult.success == false)
            return Result.fail<string>(new ErrorMessage(null, 'Failed to update avatar on remote server'));

        user.setAvatar(remoteResult.data.fileKey);

        console.log('Updating avatar in local repository with fileKey:', remoteResult.data.fileKey);

        await this.userRepository.update(user);

        return Result.success(remoteResult.data.fileKey);
    }
}
