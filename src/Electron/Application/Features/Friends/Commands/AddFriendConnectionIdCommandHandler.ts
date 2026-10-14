import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { FriendConnectionId } from '../../../../Domain/Entities/FriendConnectionId.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { AddFriendConnectionIdCommand } from '../../../../../Shared/Contracts/Friends/AddFriendConnectionId.js';

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
