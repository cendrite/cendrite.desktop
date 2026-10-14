import { Result } from '#shared/Result/Result';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { AddUserConnectionIdCommand } from '#shared/User/AddUserConnectionId';

export class AddUserConnectionIdCommandHandler implements Handler<AddUserConnectionIdCommand, void> {
    constructor(private readonly userRepository: IUserRepository) { }

    public async handle(request: AddUserConnectionIdCommand): Promise<Result> {
        const user = await this.userRepository.get(false);

        user.addConnectionId(request.connectionId);

        await this.userRepository.update(user);

        return Result.success();
    }
}
