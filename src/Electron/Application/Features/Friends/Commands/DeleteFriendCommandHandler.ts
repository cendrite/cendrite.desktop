import { ErrorMessage } from "../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../Shared/Result/Result.js";
import { IFriendProvider } from "../../../Contracts/Providers/IFriendProvider.js";
import { IChatStore } from "../../../Contracts/Repositories/IChatStore.js";
import { IFriendRepository } from "../../../Contracts/Repositories/IFriendRepository.js";
import { Handler } from "../../../Mediator/Handler.js";
import { DeleteFriendCommand } from "../../../../../Shared/Contracts/Friends/DeleteFriend.js";

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
