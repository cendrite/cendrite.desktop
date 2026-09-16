import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { MessageSentEvent } from '../../../../Domain/Events/MessageSentEvent.js';
import { MediaContract } from '../../../Contracts/Models/MediaContract.js';
import { MessageContract } from '../../../Contracts/Models/MessageContract.js';
import { IEventRepository } from '../../../Contracts/Providers/IEventRepository.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../Contracts/Repositories/IMediaStore.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { ResendMessageCommand } from '../Contracts/ResendMessage.js';
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
