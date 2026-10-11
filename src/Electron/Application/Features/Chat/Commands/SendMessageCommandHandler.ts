import { Result } from '../../../../../Shared/Result/Result.js';
import { Message } from '../../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../../Domain/Entities/MessageMedia.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { GroupLifecycle } from '../../../../Domain/Enums/GroupLifecycle.js';
import { MessageSentEvent } from '../../../../Domain/Events/MessageSentEvent.js';
import { MessageContract } from '../../../Contracts/Models/MessageContract.js';
import { IEventRepository } from '../../../Contracts/Providers/IEventRepository.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IGroupRepository } from '../../../Contracts/Repositories/IGroupRepository.js';
import { IMediaStore } from '../../../Contracts/Repositories/IMediaStore.js';
import { ILedgerWriter } from '../../../Contracts/Services/ILedgerWriter.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { SendMessageCommand } from '../Contracts/SendMessage.js';
import { v4 as uuid } from 'uuid';

export class SendMessageCommandHandler implements Handler<SendMessageCommand, MessageContract> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
        private readonly messagePump: IPump,
        private readonly ledgerWriter: ILedgerWriter,
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

        if (cmd.isGroup) {
            const group = await this.groupRepository.get(cmd.chatId);
            if (!group) {
                throw new Error(`Group with ID ${cmd.chatId} not found`);
            }
            if (group.lifecycle === GroupLifecycle.Draft) {
                group.lifecycle = GroupLifecycle.Active;
                await this.groupRepository.update(group);
            }
        }

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
            new MessageSentEvent(uuid().toString(), messageContract, cmd.connectionIds, cmd.participants, new Date()),
        );

        this.messagePump.notify();

        return Result.success(messageContract);
    }
}
