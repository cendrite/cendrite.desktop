import { v4 as uuid } from 'uuid';
import { Result } from '../../../../../Shared/Result/Result.js';
import { Message } from '../../../../Domain/Entities/Message.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { SessionManager } from '../../../../Infrastructure/Services/SessionManager.js';
import { MessageHubHandler } from '../../../../Infrastructure/Signal/Messaging/MessageHubHandler.js';
import { MessagePayload } from '../../../../Infrastructure/Signal/Messaging/ServerMessage.js';
import { IMediaProvider } from '../../../Contracts/Providers/IMediaProvider.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { Handler } from '../../../Mediator/Handler.js';
import { SendMessageCommand } from '../Contracts/SendMessage.js';

export class SendMessageCommandHandler implements Handler<SendMessageCommand, DeliveryStatus> {
    constructor(
        private readonly sessionManager: SessionManager,
        private readonly mediaProvider: IMediaProvider,
        private readonly messageHubHandler: MessageHubHandler,
        private readonly messageStore: IChatStore,
    ) { }

    public async handle(cmd: SendMessageCommand): Promise<Result<DeliveryStatus>> {
        const m_pointers = await this.mediaProvider.uploadMedia(cmd.userConnectionId, cmd.media);

        const message = new Message(
            uuid(),
            cmd.chatId,
            cmd.userConnectionId,
            new Date(),
            cmd.message,
            null,
            DeliveryStatus.Pending,
        );
        await this.messageStore.storeMessage(message);

        for (const conId of cmd.connectionIds) {
            this.sessionManager.setConnectionId(conId);
            const cipher = await this.sessionManager.encrypt(
                new MessagePayload(cmd.message, m_pointers, cmd.participants, DeliveryStatus.Pending),
            );
        }

        throw new Error('Not implemented');
    }
}
