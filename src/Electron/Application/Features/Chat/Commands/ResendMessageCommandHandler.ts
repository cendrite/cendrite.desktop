import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { MediaContract } from '#shared/Models/MediaContract';
import { MessageContract } from '#shared/Models/MessageContract';
import { IEventRepository } from '#electron/Application/Contracts/Providers/IEventRepository';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IMediaStore } from '#electron/Application/Contracts/Repositories/IMediaStore';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { ResendMessageCommand } from '#shared/Chat/ResendMessage';
import { v4 as uuid } from 'uuid';

export class ResendMessageCommandHandler implements Handler<ResendMessageCommand> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly chatStore: IChatStore,
        private readonly messagePump: IPump,
        private readonly mediaStore: IMediaStore,
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

        const mediaContracts: MediaContract[] = [];

        for (const media of message.messageMedia ?? []) {
            const mediaContent = await this.mediaStore.get(media.id);
            mediaContracts.push(new MediaContract(media.id, media.type, mediaContent));
        }

        const messageContract = new MessageContract(
            message.id,
            message.chatId,
            message.senderId,
            message.content,
            message.timestamp,
            mediaContracts,
            DeliveryStatus.Pending,
            message.messageToken,
        );

        await this.eventRepository.appendEvent(
            new MessageSentEvent(uuid().toString(), messageContract, cmd.connectionIds, cmd.participants, new Date()),
        );

        this.messagePump.notify();

        return Result.success();
    }
}
