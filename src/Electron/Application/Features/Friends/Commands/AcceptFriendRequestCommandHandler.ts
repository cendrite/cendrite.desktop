import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { Friend } from '#electron/Domain/Aggregates/Friend';
import { FriendConnectionId } from '#electron/Domain/Entities/FriendConnectionId';
import { IFriendProvider } from '#electron/Application/Contracts/Providers/IFriendProvider';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { AcceptFriendRequestCommand } from '#shared/Friends/AcceptFriendRequest';
import { FriendContract } from '#shared/Models/FriendContract';

export class AcceptFriendRequestCommandHandler implements Handler<AcceptFriendRequestCommand, FriendContract> {
    constructor(
        private readonly friendProvider: IFriendProvider,
        private readonly friendRepository: IFriendRepository,
    ) { }

    public async handle(cmd: AcceptFriendRequestCommand): Promise<Result<FriendContract>> {
        const acceptResult = await this.friendProvider.acceptFriendRequest(cmd.friendTag);

        if (acceptResult.success === false || !acceptResult.data)
            return Result.fail<FriendContract>(new ErrorMessage(null, 'Failed to accept friend request'));

        const friend = new Friend();
        friend.id = acceptResult.data.tag;
        friend.username = acceptResult.data.username;
        friend.displayName = acceptResult.data.displayName;
        friend.avatarKey = acceptResult.data.avatarKey ?? null;
        friend.connectionIds = acceptResult.data.connectionIds.map((id) => new FriendConnectionId(id, friend));

        await this.friendRepository.create(friend);

        return Result.success(
            new FriendContract(
                friend.id,
                friend.username,
                friend.displayName,
                friend.avatarKey,
                friend.connectionIds.map((c) => c.connectionId),
            ),
        );
    }
}
