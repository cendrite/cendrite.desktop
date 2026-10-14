import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { UpdateFriendCommand } from '../../../../../Shared/Contracts/Friends/UpdateFriend.js';

export class UpdateFriendCommandHandler implements Handler<UpdateFriendCommand> {
    constructor(private readonly friendRepository: IFriendRepository) { }

    public async handle(request: UpdateFriendCommand): Promise<Result> {
        const friend = await this.friendRepository.getById(request.id);

        if (!friend) {
            return Result.fail(new ErrorMessage(null, 'Friend not found'));
        }

        if (request.username !== null) {
            friend.username = request.username;
        }
        if (request.displayName !== null) {
            friend.displayName = request.displayName;
        }
        if (request.avatarKey !== null) {
            friend.avatarKey = request.avatarKey;
        }

        await this.friendRepository.update(friend);
        return Result.success();
    }
}
