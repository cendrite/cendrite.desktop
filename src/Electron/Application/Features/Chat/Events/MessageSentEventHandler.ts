import { Result } from '../../../../../Shared/Result/Result.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { ISessionManager } from '../../../Contracts/Services/ISessionManager.js';
import { IMessageHubHandler } from '../../../Contracts/Services/IMessageHubHandler.js';
import { ServerMessage } from '../../../Contracts/Messaging/ServerMessage.js';
import { Envelope, MessagePayload, PayloadType } from '../../../Contracts/Messaging/Envelope.js';
import { Handler } from '../../../Mediator/Handler.js';
import { IMediaService } from '../../../Services/Media/MediaService.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { MessageSentCommand } from '../Contracts/SendMessage.js';
import { tag } from '../../../../Utilities.js';

export class MessageSentCommandHandler implements Handler<MessageSentCommand, DeliveryStatus> {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly mediaService: IMediaService,
        private readonly chatStore: IChatStore,
    ) { }

    async handle(cmd: MessageSentCommand): Promise<Result<DeliveryStatus>> {
        if (!cmd.message.messageToken) {
            throw new Error('Cannot send chat message without a token');
        }

        const m_pointers = await this.mediaService.upload(cmd.message.media);

        const chat = await this.chatStore.getChat(cmd.message.chatId);

        const messages: ServerMessage[] = [];

        for (const conId of cmd.connectionIds) {
            const envelope = new Envelope(
                PayloadType.ChatMessage,
                new MessagePayload(
                    cmd.message.text,
                    m_pointers,
                    cmd.participants,
                    cmd.message.deliveryStatus,
                    chat?.groupId ?? null,
                ),
            );

            const cipher = await this.sessionManager.encrypt(envelope, conId);

            messages.push(
                new ServerMessage(
                    cmd.message.id,
                    cmd.message.chatId,
                    cmd.message.senderId,
                    conId,
                    cipher,
                    cmd.message.date,
                    cmd.message.messageToken,
                ),
            );
        }

        const receipt = await this.messageHubHandler.sendMessage(messages);

        return Result.success(receipt);
    }
}
