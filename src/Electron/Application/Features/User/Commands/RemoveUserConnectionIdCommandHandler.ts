import { Result } from '#shared/Result/Result';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { RemoveUserConnectionIdCommand } from '#shared/User/RemoveUserConnectionId';

export class RemoveUserConnectionIdCommandHandler implements Handler<RemoveUserConnectionIdCommand, void> {

    constructor(private readonly userRepository: IUserRepository) { }

    public async handle(request: RemoveUserConnectionIdCommand): Promise<Result<void>> {
        const user = await this.userRepository.get(false);

        user.removeConnectionId(request.connectionId);

        await this.userRepository.update(user);

        return Result.success();
    }
}
