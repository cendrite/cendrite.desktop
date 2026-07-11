import { Result } from '../../../../../../Shared/Result/Result.js';
import { ChatStore } from '../../../../../Infrastructure/Persistence/Repositories/ChatStore.js';
import { MediaStore } from '../../../../../Infrastructure/Persistence/Store/MediaStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { MediaDto } from '../../Dtos/MediaDto.js';
import { MessageDto } from '../../Dtos/MessageDto.js';
import { GetMessagesQuery } from './GetMessagesQuery.js';

export class GetMessagesQueryHandler implements Handler<GetMessagesQuery, MessageDto[]> {
    public async handle(request: GetMessagesQuery): Promise<Result<MessageDto[]>> {
        const chatStore = new ChatStore();
        const mediaStore = MediaStore.getInstance();

        const messages = await chatStore.getMessages(request.chatId, request.offset, request.take);

        messages.reverse();

        const messageDtos = await Promise.all(
            messages.map(async (message) => {
                const mediaDtos: MediaDto[] = [];
                for (const m of message.messageMedia ?? []) {
                    const mediaContent = await mediaStore.get(m.id);
                    mediaDtos.push(MediaDto.fromMessageMedia(m, mediaContent));
                }
                return MessageDto.fromMessage(message, mediaDtos);
            }),
        );

        return Result.success(messageDtos);
    }
}
