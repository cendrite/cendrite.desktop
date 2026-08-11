import { Result } from '../../../../../Shared/Result/Result.js';
import { Message } from '../../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../../Domain/Entities/MessageMedia.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { MessageContract } from '../../../Contracts/Models/MessageContract.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../Contracts/Repositories/IMediaStore.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { SendMessageV2Command } from '../Contracts/SendMessage.js';
import { v4 as uuid } from 'uuid';

export class SendMessageV2CommandHandler implements Handler<SendMessageV2Command, MessageContract> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
        private readonly messagePump: IPump,    
    ) { }

    async handle(cmd: SendMessageV2Command): Promise<Result<MessageContract>> {
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

        for (const m of cmd.media) {
            await this.mediaStore.store(m.id, m.content);
        }

        const messageContract = new MessageContract(
            message.id,
            message.chatId,
            message.senderId,
            message.content,
            message.timestamp,
            cmd.media,
            message.deliveryStatus,
            message.messageToken,
        );

        this.messagePump.notify();

        return Result.success(messageContract);
    }
}

