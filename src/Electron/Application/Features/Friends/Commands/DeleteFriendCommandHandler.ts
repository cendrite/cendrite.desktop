import { ErrorMessage } from "#shared/Result/ErrorMessage";
import { Result } from "#shared/Result/Result";
import { IFriendProvider } from "#electron/Application/Contracts/Providers/IFriendProvider";
import { IChatStore } from "#electron/Application/Contracts/Repositories/IChatStore";
import { IFriendRepository } from "#electron/Application/Contracts/Repositories/IFriendRepository";
import { Handler } from "#electron/Application/Mediator/Handler";
import { DeleteFriendCommand } from "#shared/Friends/DeleteFriend";

export class DeleteFriendCommandHandler implements Handler<DeleteFriendCommand> {
    constructor(
        private readonly friendProvider: IFriendProvider,
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
    ) { }

    public async handle(cmd: DeleteFriendCommand): Promise<Result> {
        if (cmd.localOnly === false) {
            const remoteResult = await this.friendProvider.deleteFriend(cmd.id);

            if (remoteResult.success === false)
                return Result.fail(new ErrorMessage(null, 'Failed to delete friend on remote server'));
        }

        const friend = await this.friendRepository.getById(cmd.id);

        if (!friend) return Result.fail(new ErrorMessage(null, 'Friend not found'));

        await this.chatStore.deleteByFriendId(friend.id);
        await this.friendRepository.delete(friend.id);

        return Result.success();
    }
}
