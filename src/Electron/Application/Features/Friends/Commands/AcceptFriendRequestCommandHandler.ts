import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { Friend } from '../../../../Domain/Aggregates/Friend.js';
import { FriendConnectionId } from '../../../../Domain/Entities/FriendConnectionId.js';
import { IFriendProvider } from '../../../Contracts/Providers/IFriendProvider.js';
import { IFriendRepository } from '../../../Contracts/Repositories/IFriendRepository.js';
import { Handler } from '../../../Mediator/Handler.js';
import { AcceptFriendRequestCommand } from '../../../../../Shared/Contracts/Friends/AcceptFriendRequest.js';
import { FriendContract } from '../../../../../Shared/Contracts/Models/FriendContract.js';

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
        friend.avatarKey = acceptResult.data.profilePictureUrl ?? null;
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
