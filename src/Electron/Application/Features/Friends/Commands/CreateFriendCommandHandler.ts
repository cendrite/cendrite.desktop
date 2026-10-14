import { Result } from '../../../../../Shared/Result/Result.js';
import { Friend } from '../../../../Domain/Aggregates/Friend.js';
import { FriendConnectionId } from '../../../../Domain/Entities/FriendConnectionId.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { CreateFriendCommand } from '../../../../../Shared/Friends/CreateFriend.js';

export class CreateFriendCommandHandler implements Handler<CreateFriendCommand> {

    constructor(private readonly friendRepository: IFriendRepository) { }

    public async handle(request: CreateFriendCommand): Promise<Result> {
        const friend = new Friend();
        friend.id = request.tag;
        friend.username = request.username;
        friend.displayName = request.displayName;
        friend.avatarKey = request.avatarKey;

        if (request.connectionIds) {
            friend.connectionIds = request.connectionIds.map((id) => new FriendConnectionId(id, friend));
        } else {
            friend.connectionIds = [];
        }

        console.log('Creating new friend:', friend);
        await this.friendRepository.create(friend);
        return Result.success();
    }
}
