import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { RemoveFriendConnectionIdCommand } from '../../../../../Shared/Contracts/Friends/RemoveFriendConnectionId.js';

export class RemoveFriendConnectionIdCommandHandler implements Handler<RemoveFriendConnectionIdCommand> {
    constructor(private readonly friendRepository: IFriendRepository) { }
    
    public async handle(request: RemoveFriendConnectionIdCommand): Promise<Result> {
        const friend = await this.friendRepository.getById(request.id);

        if (!friend) {
            return Result.fail(new ErrorMessage(null, 'Friend not found'));
        }

        friend.connectionIds = friend.connectionIds.filter((conn) => !request.connectionId.includes(conn.connectionId));

        await this.friendRepository.update(friend);
        return Result.success();
    }
}
