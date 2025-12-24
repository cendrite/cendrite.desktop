import { Result } from '../../../../../../Shared/Result/Result.js';
import { ChatStore } from '../../../../../Persistence/Repositories/ChatStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { DeleteChatCommand } from './DeleteChatCommand.js';

export class DeleteChatCommandHandler implements Handler<DeleteChatCommand> {
    public async handle(request: DeleteChatCommand): Promise<Result> {
        const chatStore = new ChatStore();
        await chatStore.deleteChat(request.chatId);
        return Result.success();
    }
}
