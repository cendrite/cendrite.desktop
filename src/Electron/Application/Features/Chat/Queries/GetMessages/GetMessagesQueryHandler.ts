import { Result } from '../../../../../../Shared/Result/Result.js';
import { ChatStore } from '../../../../../Persistence/Repositories/ChatStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { MessageDto } from '../../Dtos/MessageDto.js';
import { GetMessagesQuery } from './GetMessagesQuery.js';

export class GetMessagesQueryHandler implements Handler<GetMessagesQuery, MessageDto[]> {
    public async handle(request: GetMessagesQuery): Promise<Result<MessageDto[]>> {
        const chatStore = new ChatStore();

        const messages = await chatStore.getMessages(request.chatId, request.offset, request.take);

        messages.reverse();

        const messageDtos = messages.map((m) => MessageDto.fromMessage(m));

        return Result.success(messageDtos);
    }
}
