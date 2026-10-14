import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { Friend } from '#electron/Domain/Aggregates/Friend';
import { FriendConnectionId } from '#electron/Domain/Entities/FriendConnectionId';
import { FriendResponse, IFriendProvider } from '#electron/Application/Contracts/Providers/IFriendProvider';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { SyncFriendsQuery } from '#shared/Friends/SyncFriends';
import { FriendContract } from '#shared/Models/FriendContract';

export class SyncFriendsQueryHandler implements Handler<SyncFriendsQuery, FriendContract[]> {
    constructor(
        private readonly friendProvider: IFriendProvider,
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
    ) { }

    public async handle(_query: SyncFriendsQuery): Promise<Result<FriendContract[]>> {
        const remoteResult = await this.friendProvider.getFriends();

        // Bail out rather than reconcile against an empty list, which would wipe every local friend.
        if (remoteResult.success === false || !remoteResult.data)
            return Result.fail<FriendContract[]>(new ErrorMessage(null, 'Failed to load friends from remote server'));

        const remoteFriends = remoteResult.data;
        const localFriends = await this.friendRepository.getAll();
        const localById = new Map(localFriends.map((friend) => [friend.id, friend]));
        const remoteTags = new Set(remoteFriends.map((friend) => friend.userTag));

        for (const local of localFriends) {
            if (remoteTags.has(local.id)) continue;

            await this.chatStore.deleteByFriendId(local.id);
            await this.friendRepository.delete(local.id);
        }

        const synced: Friend[] = [];

        for (const remote of remoteFriends) {
            const local = localById.get(remote.userTag);
            const friend = this.applyRemote(local ?? new Friend(), remote);

            if (local) await this.friendRepository.update(friend);
            else await this.friendRepository.create(friend);

            synced.push(friend);
        }

        return Result.success(
            synced.map(
                (friend) =>
                    new FriendContract(
                        friend.id,
                        friend.username,
                        friend.displayName ?? null,
                        friend.avatarKey,
                        friend.connectionIds.map((c) => c.connectionId),
                    ),
            ),
        );
    }

    private applyRemote(friend: Friend, remote: FriendResponse): Friend {
        const existingConnectionIds = friend.connectionIds ?? [];

        friend.id = remote.userTag;
        friend.username = remote.username;
        friend.displayName = remote.displayName;
        friend.avatarKey = remote.avatarKey;

        // Reusing the stored entities keeps their rows; the ones left out are removed by the
        // relation's orphanedRowAction on save.
        friend.connectionIds = remote.connectionIds.map(
            (connectionId) =>
                existingConnectionIds.find((existing) => existing.connectionId === connectionId) ??
                new FriendConnectionId(connectionId, friend),
        );

        return friend;
    }
}
