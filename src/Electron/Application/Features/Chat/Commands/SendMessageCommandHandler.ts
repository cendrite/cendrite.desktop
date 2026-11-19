import { Result } from '#shared/Result/Result';
import { Message } from '#electron/Domain/Entities/Message';
import { MessageMedia } from '#electron/Domain/Entities/MessageMedia';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { MessageContract } from '#shared/Models/MessageContract';
import { IEventRepository } from '#electron/Application/Contracts/Providers/IEventRepository';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IMediaStore } from '#electron/Application/Contracts/Repositories/IMediaStore';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { SendMessageCommand } from '#shared/Chat/SendMessage';
import { v4 as uuid } from 'uuid';

export class SendMessageCommandHandler implements Handler<SendMessageCommand, MessageContract> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
        private readonly messagePump: IPump,
    ) { }

    public async handle(cmd: SendMessageCommand): Promise<Result<MessageContract>> {
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

        await this.eventRepository.appendEvent(
            new MessageSentEvent(
                message.id,
                messageContract,
                cmd.connectionIds,
                cmd.participants,
                new Date(),
            ),
        );

        this.messagePump.notify();

        return Result.success(messageContract);
    }
}
