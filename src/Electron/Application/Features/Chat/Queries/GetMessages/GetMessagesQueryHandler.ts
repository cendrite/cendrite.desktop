import { Result } from '../../../../../../Shared/Result/Result.js';
import { Message } from '../../../../../Domain/Entities/Message.js';
import { ChatStore } from '../../../../../Persistence/Repositories/ChatStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { MessageDto } from '../../Dtos/MessageDto.js';
import { GetMessagesQuery } from './GetMessagesQuery.js';

export class GetMessagesQueryHandler implements Handler<GetMessagesQuery, MessageDto[]> {
    public async handle(request: GetMessagesQuery): Promise<Result<MessageDto[]>> {
        const chatStore = new ChatStore();

        const messages = await chatStore.getMessages(request.chatId, request.offset, request.take);
        messages.reverse();
        const messageDtos = this.mapToDto(messages);

        return Result.success(messageDtos);
    }

    private mapToDto(messages: Message[]): MessageDto[] {
        return messages.map((msg) => new MessageDto(
            msg.id,
            msg.messageToken,
            msg.senderId,
            msg.content,
            msg.contentUrl,
            msg.timestamp,
            msg.deliveryStatus,
        ));
    }
}
