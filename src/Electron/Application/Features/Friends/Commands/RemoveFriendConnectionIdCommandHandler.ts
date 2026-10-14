import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { RemoveFriendConnectionIdCommand } from '#shared/Friends/RemoveFriendConnectionId';

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
