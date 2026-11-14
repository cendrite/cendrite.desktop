import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { IUserProvider } from '#electron/Application/Contracts/Providers/IUserProvider';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { RemoveAvatarCommand } from '#shared/User/RemoveAvatar';

export class RemoveAvatarCommandHandler implements Handler<RemoveAvatarCommand, void> {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly userProvider: IUserProvider,
    ) { }

    public async handle(_cmd: RemoveAvatarCommand): Promise<Result<void>> {
        const removed = await this.userProvider.removeAvatar();
        if (!removed.success) return Result.fail(new ErrorMessage(null, 'Failed to remove avatar on remote server'));

        const user = await this.userRepository.get(false);
        user.removeAvatar();
        await this.userRepository.update(user);

        return Result.success();
    }
}
