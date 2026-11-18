import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { MessageContract } from '#shared/Models/MessageContract';
import { IEventRepository } from '#electron/Application/Contracts/Providers/IEventRepository';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { ResendMessageCommand } from '#shared/Chat/ResendMessage';

export class ResendMessageCommandHandler implements Handler<ResendMessageCommand> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly chatStore: IChatStore,
        private readonly messagePump: IPump,
    ) { }

    async handle(cmd: ResendMessageCommand): Promise<Result> {
        const message = await this.chatStore.getMessage(cmd.ChatId, cmd.MessageId);

        if (!message) {
            return Result.fail(
                new ErrorMessage(null, `Message with ID ${cmd.MessageId} not found in chat ${cmd.ChatId}`),
            );
        }

        if (message.deliveryStatus !== DeliveryStatus.Failed) {
            return Result.fail(
                new ErrorMessage(null, `Message with ID ${cmd.MessageId} is not in a failed state`),
            );
        }

        const event = await this.eventRepository.getEventById<MessageSentEvent>(message.id);

        if (!event) {
            return Result.fail(
                new ErrorMessage(null, `Message with ID ${cmd.MessageId} has nothing to resend`),
            );
        }

        const messageContract = new MessageContract(
            event.message.id,
            event.message.chatId,
            event.message.senderId,
            event.message.text,
            event.message.date,
            event.message.media,
            DeliveryStatus.Pending,
            event.message.messageToken,
        );

        await this.eventRepository.appendEvent(
            new MessageSentEvent(event.id, messageContract, event.connectionIds, event.participants, new Date(), event.payloads),
        );

        this.messagePump.notify();

        return Result.success();
    }
}
