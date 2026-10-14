import { Result } from '#shared/Result/Result';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { Handler } from '#electron/Application/Mediator/Handler';
import { DeleteChatCommand } from '#shared/Chat/DeleteChat';

export class DeleteChatCommandHandler implements Handler<DeleteChatCommand> {
    constructor(private readonly chatStore: IChatStore) { }

    public async handle(request: DeleteChatCommand): Promise<Result> {
        await this.chatStore.deleteChat(request.chatId);
        return Result.success();
    }
}
