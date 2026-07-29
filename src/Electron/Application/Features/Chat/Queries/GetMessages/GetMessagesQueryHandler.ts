import { Result } from '../../../../../../Shared/Result/Result.js';
import { IChatStore } from '../../../../Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../../Contracts/Repositories/IMediaStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { MediaDto } from '../../Dtos/MediaDto.js';
import { MessageDto } from '../../Dtos/MessageDto.js';
import { GetMessagesQuery } from './GetMessagesQuery.js';

export class GetMessagesQueryHandler implements Handler<GetMessagesQuery, MessageDto[]> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
    ) { }

    public async handle(request: GetMessagesQuery): Promise<Result<MessageDto[]>> {

        const messages = await this.chatStore.getMessages(request.chatId, request.offset, request.take);

        messages.reverse();

        const messageDtos = await Promise.all(
            messages.map(async (message) => {
                const mediaDtos: MediaDto[] = [];
                for (const m of message.messageMedia ?? []) {
                    const mediaContent = await this.mediaStore.get(m.id);
                    mediaDtos.push(MediaDto.fromMessageMedia(m, mediaContent));
                }
                return MessageDto.fromMessage(message, mediaDtos);
            }),
        );

        return Result.success(messageDtos);
    }
}
