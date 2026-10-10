import { Result } from '../../../../../Shared/Result/Result.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { ISessionManager } from '../../../Contracts/Services/ISessionManager.js';
import { IMessageHubHandler } from '../../../Contracts/Services/IMessageHubHandler.js';
import { ServerMessage } from '../../../Contracts/Messaging/ServerMessage.js';
import { Envelope, MessagePayload } from '../../../Contracts/Messaging/Payload.js';
import { Handler } from '../../../Mediator/Handler.js';
import { IMediaService } from '../../../Services/Media/MediaService.js';
import { MessageSentCommand } from '../Contracts/SendMessage.js';

export class MessageSentCommandHandler implements Handler<MessageSentCommand, DeliveryStatus> {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly mediaService: IMediaService,
    ) { }

    async handle(cmd: MessageSentCommand): Promise<Result<DeliveryStatus>> {
        if (!cmd.message.messageToken) {
            throw new Error('Cannot send chat message without a token');
        }

        const m_pointers = await this.mediaService.upload(cmd.message.media);

        const messages: ServerMessage[] = [];

        for (const conId of cmd.connectionIds) {
            const envelope = new Envelope(
                new MessagePayload(
                    cmd.message.chatId,
                    cmd.message.text,
                    m_pointers,
                    cmd.participants,
                    cmd.message.deliveryStatus,
                ),
            );

            const cipher = await this.sessionManager.encrypt(envelope, conId);

            messages.push(
                new ServerMessage(
                    cmd.message.id,
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
