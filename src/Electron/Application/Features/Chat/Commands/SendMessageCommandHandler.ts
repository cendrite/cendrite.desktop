import { Result } from '../../../../../Shared/Result/Result.js';
import { Message } from '../../../../Domain/Entities/Message.js';
import { v4 as uuid } from 'uuid';
import { MessageMedia } from '../../../../Domain/Entities/MessageMedia.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { SessionManager } from '../../../../Infrastructure/Services/SessionManager.js';
import { MessageHubHandler } from '../../../../Infrastructure/Signal/Messaging/MessageHubHandler.js';
import {
    MessagePayload,
    PayloadType,
    ServerMessage,
} from '../../../../Infrastructure/Signal/Messaging/ServerMessage.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { Handler } from '../../../Mediator/Handler.js';
import { IMediaService } from '../../../Services/Media/MediaService.js';
import { SendMessageCommand } from '../Contracts/SendMessage.js';
import { MessageContract } from '../../../Contracts/Models/MessageContract.js';
import { IMediaStore } from '../../../Contracts/Repositories/IMediaStore.js';

export class SendMessageCommandHandler implements Handler<SendMessageCommand, MessageContract> {
    constructor(
        private readonly sessionManager: SessionManager,
        private readonly mediaService: IMediaService,
        private readonly messageHubHandler: MessageHubHandler,
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
    ) { }

    public async handle(cmd: SendMessageCommand): Promise<Result<MessageContract>> {
        const m_pointers = await this.mediaService.upload(cmd.userConnectionId, cmd.media);
        
        for (const m of cmd.media) {
            await this.mediaStore.store(m.id, m.content);
        }

        const message = new Message(
            cmd.messageId,
            cmd.chatId,
            cmd.userConnectionId,
            new Date(),
            cmd.message,
            cmd.media.map((m) => new MessageMedia(m.id, m.type, cmd.messageId)),
            DeliveryStatus.Pending,
            uuid().toString(),
        );

        await this.chatStore.storeMessage(message);

        const messages: ServerMessage[] = [];

        for (const conId of cmd.connectionIds) {
            this.sessionManager.setConnectionId(conId);
            const cipher = await this.sessionManager.encrypt(
                new MessagePayload(message.content, m_pointers, cmd.participants, message.deliveryStatus),
            );

            messages.push(
                new ServerMessage(
                    message.id,
                    message.chatId,
                    message.senderId,
                    conId,
                    PayloadType.ChatMessage,
                    cipher,
                    message.timestamp,
                    message.messageToken,
                ),
            );
        }

        const receipt = await this.messageHubHandler.sendMessage(messages);

        const returnMsg = new MessageContract(
            message.id,
            message.chatId,
            message.senderId,
            message.content,
            message.timestamp,
            cmd.media,
            receipt,
            message.messageToken,
        );

        return Result.success(returnMsg);
    }
}
