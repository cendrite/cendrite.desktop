import { DeleteFriendCommand } from './DeleteFriendCommand.js';
import { Result } from '../../../../../../Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../../Shared/Result/ErrorMessage.js';
import { FriendRepository } from '../../../../../Infrastructure/Persistence/Repositories/FriendRepository.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { ChatStore } from '../../../../../Infrastructure/Persistence/Repositories/ChatStore.js';

export class DeleteFriendCommandHandler implements Handler<DeleteFriendCommand> {
    public async handle(request: DeleteFriendCommand): Promise<Result> {
        try {
            const friendRepository = new FriendRepository();
            const chatStore = new ChatStore();

            const friend = await friendRepository.getById(request.id);

            if (!friend) {
                return Result.fail(new ErrorMessage(null, 'Friend not found'));
            }
            await chatStore.deleteByFriendId(friend.id);

            await friendRepository.delete(request.id);

            return Result.success();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Delete Friend Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, 'Delete Friend Failed'));
        }
    }
}
