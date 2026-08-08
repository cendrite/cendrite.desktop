import { Result } from "../../../../../Shared/Result/Result.js";
import { Message } from "../../../../Domain/Entities/Message.js";
import { MessageMedia } from "../../../../Domain/Entities/MessageMedia.js";
import { IChatStore } from "../../../Contracts/Repositories/IChatStore.js";
import { IMediaStore } from "../../../Contracts/Repositories/IMediaStore.js";
import { Handler } from "../../../Mediator/Handler.js";
import { AddMessageCommand } from "../Contracts/AddMessage.js";

export class AddMessageCommandHandler implements Handler<AddMessageCommand> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
    ) { }

    public async handle(request: AddMessageCommand): Promise<Result> {

        const message = new Message(
            request.messageId,
            request.chatId,
            request.senderId,
            request.timestamp,
            request.content,
            request.media?.map((mdto) => new MessageMedia(mdto.id, mdto.type, request.messageId)) ?? [],
            request.deliveryStatus,
            request.messageToken,
        );

        if (request.media) {
            for (const media of request.media) {
                await this.mediaStore.store(media.id, media.content);
            }
        }

        await this.chatStore.storeMessage(message);

        return Result.success();
    }
}
