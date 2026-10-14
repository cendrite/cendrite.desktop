import { Result } from "../../../../../Shared/Result/Result.js";
import { MediaContract } from "../../../../../Shared/Contracts/Models/MediaContract.js";
import { MessageContract } from "../../../../../Shared/Contracts/Models/MessageContract.js";
import { IChatStore } from "../../../Contracts/Repositories/IChatStore.js";
import { IMediaStore } from "../../../Contracts/Repositories/IMediaStore.js";
import { Handler } from "../../../Mediator/Handler.js";
import { GetMessagesQuery } from "../../../../../Shared/Contracts/Chat/GetMessages.js";

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
