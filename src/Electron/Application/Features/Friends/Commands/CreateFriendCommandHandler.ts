import { Result } from '#shared/Result/Result';
import { Friend } from '#electron/Domain/Aggregates/Friend';
import { FriendConnectionId } from '#electron/Domain/Entities/FriendConnectionId';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { CreateFriendCommand } from '#shared/Friends/CreateFriend';

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
