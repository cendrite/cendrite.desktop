import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { FriendConnectionId } from '#electron/Domain/Entities/FriendConnectionId';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { AddFriendConnectionIdCommand } from '#shared/Friends/AddFriendConnectionId';

export class AddFriendConnectionIdCommandHandler implements Handler<AddFriendConnectionIdCommand> {
    constructor(private readonly friendRepository: IFriendRepository) { }

    public async handle(request: AddFriendConnectionIdCommand): Promise<Result> {
        const friend = await this.friendRepository.getById(request.id);

        if (!friend) {
            return Result.fail(new ErrorMessage(null, 'Friend not found'));
        }

        for (const connId of request.connectionId) {
            if (friend.connectionIds.some((con) => con.connectionId === connId)) {
                console.warn(`Connection ID ${connId} already exists for friend ${friend.id}`);
                continue;
            }
            friend.connectionIds.push(new FriendConnectionId(connId, friend));
        }

        await this.friendRepository.update(friend);
        return Result.success();
    }
}
