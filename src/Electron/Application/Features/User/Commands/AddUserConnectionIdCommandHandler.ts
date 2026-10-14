import { Result } from '../../../../../Shared/Result/Result.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { AddUserConnectionIdCommand } from '../../../../../Shared/Contracts/User/AddUserConnectionId.js';

export class AddUserConnectionIdCommandHandler implements Handler<AddUserConnectionIdCommand, void> {
    constructor(private readonly userRepository: IUserRepository) { }

    public async handle(request: AddUserConnectionIdCommand): Promise<Result> {
        const user = await this.userRepository.get(false);

        user.addConnectionId(request.connectionId);

        await this.userRepository.update(user);

        return Result.success();
    }
}
