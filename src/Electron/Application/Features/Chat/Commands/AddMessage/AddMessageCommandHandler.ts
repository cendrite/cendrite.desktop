import { Result } from '../../../../../../Shared/Result/Result.js';
import { Message } from '../../../../../Domain/Entities/Message.js';
import { ChatStore } from '../../../../../Persistence/Repositories/ChatStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { AddMessageCommand } from './AddMessageCommand.js';

export class AddMessageCommandHandler implements Handler<AddMessageCommand> {
    public async handle(request: AddMessageCommand): Promise<Result> {
        const chatStore = new ChatStore();
        console.log(`Storing message with ID: ${request.messageId} to chat ID: ${request.chatId}`);

        const message = new Message(
            request.messageId,
            request.chatId,
            request.senderId,
            request.timestamp,
            request.content,
            request.media,
            request.deliveryStatus,
            request.messageToken,
        );

        await chatStore.storeMessage(message);

        return Result.success();
    }
}
