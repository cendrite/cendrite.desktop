import { Result } from "#shared/Result/Result";
import { MediaContract } from "#shared/Models/MediaContract";
import { MessageContract } from "#shared/Models/MessageContract";
import { IChatStore } from "#electron/Application/Contracts/Repositories/IChatStore";
import { IMediaStore } from "#electron/Application/Contracts/Repositories/IMediaStore";
import { Handler } from "#electron/Application/Mediator/Handler";
import { GetMessagesQuery } from "#shared/Chat/GetMessages";

export class GetMessagesQueryHandler implements Handler<GetMessagesQuery, MessageContract[]> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
    ) { }

    public async handle(request: GetMessagesQuery): Promise<Result<MessageContract[]>> {

        const messages = await this.chatStore.getMessages(request.chatId, request.offset, request.take);

        messages.reverse();

        const messageDtos = await Promise.all(
            messages.map(async (message) => {
                const mediaDtos: MediaContract[] = [];
                for (const m of message.messageMedia ?? []) {
                    const mediaContent = await this.mediaStore.get(m.id);
                    mediaDtos.push(new MediaContract(m.id, m.type, mediaContent));
                }
                return new MessageContract(
                    message.id,
                    message.chatId,
                    message.senderId,
                    message.content,
                    message.timestamp,
                    mediaDtos,
                    message.deliveryStatus,
                );
            }),
        );

        return Result.success(messageDtos);
    }
}
