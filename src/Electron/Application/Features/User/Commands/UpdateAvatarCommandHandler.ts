import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { IUserProvider } from '../../../Contracts/Providers/IUserProvider.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { UpdateAvatarCommand } from '../Contracts/UpdateAvatarCommand.js';

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

        user.setAvatar(remoteResult.data!.fileKey);

        console.log('Updating avatar in local repository with fileKey:', remoteResult.data!.fileKey);

        await this.userRepository.update(user);

        return Result.success(remoteResult.data!.fileKey);
    }
}
