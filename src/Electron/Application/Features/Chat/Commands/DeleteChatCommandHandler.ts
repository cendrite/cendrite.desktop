import { Result } from '../../../../../Shared/Result/Result.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { Handler } from '../../../Mediator/Handler.js';
import { DeleteChatCommand } from '../../../../../Shared/Chat/DeleteChat.js';

export class DeleteChatCommandHandler implements Handler<DeleteChatCommand> {
    constructor(private readonly chatStore: IChatStore) { }

    public async handle(request: DeleteChatCommand): Promise<Result> {
        await this.chatStore.deleteChat(request.chatId);
        return Result.success();
    }
}
