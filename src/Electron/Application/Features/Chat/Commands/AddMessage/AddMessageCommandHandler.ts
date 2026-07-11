import { Result } from '../../../../../../Shared/Result/Result.js';
import { Message } from '../../../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../../../Domain/Entities/MessageMedia.js';
import { ChatStore } from '../../../../../Infrastructure/Persistence/Repositories/ChatStore.js';
import { MediaStore } from '../../../../../Infrastructure/Persistence/Store/MediaStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { AddMessageCommand } from './AddMessageCommand.js';

export class AddMessageCommandHandler implements Handler<AddMessageCommand> {
    public async handle(request: AddMessageCommand): Promise<Result> {
        const chatStore = new ChatStore();
        const mediaStore = MediaStore.getInstance();

        const message = new Message(
            request.messageId,
            request.chatId,
            request.senderId,
            request.timestamp,
            request.content,
            request.media?.map((mdto) => new MessageMedia(mdto.id, mdto.type, request.messageId)) ?? [],
            request.deliveryStatus,
            request.messageToken
        );

        if (request.media) {
            for (const media of request.media) {
                await mediaStore.store(media.id, media.content);
            }
        }

        await chatStore.storeMessage(message);

        return Result.success();
    }
}
