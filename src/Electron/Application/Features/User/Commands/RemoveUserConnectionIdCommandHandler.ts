import { Result } from '../../../../../Shared/Result/Result.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { RemoveUserConnectionIdCommand } from '../../../../../Shared/Contracts/User/RemoveUserConnectionId.js';

export class RemoveUserConnectionIdCommandHandler implements Handler<RemoveUserConnectionIdCommand, void> {

    constructor(private readonly userRepository: IUserRepository) { }

    public async handle(request: RemoveUserConnectionIdCommand): Promise<Result<void>> {
        const user = await this.userRepository.get(false);

        user.removeConnectionId(request.connectionId);

        await this.userRepository.update(user);

        return Result.success();
    }
}
