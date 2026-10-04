import { Result } from '../../../../../Shared/Result/Result.js';
import { Message } from '../../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../../Domain/Entities/MessageMedia.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { LedgerOperationQueuedEvent } from '../../../../Domain/Events/LedgerOperationQueuedEvent.js';
import { MessageSentEvent } from '../../../../Domain/Events/MessageSentEvent.js';
import { GroupLifecycle } from '../../../../Domain/Enums/GroupLifecycle.js';
import { ChatPrivileges } from '../../../../Domain/Enums/ChatPrivileges.js';
import { LedgerOperationType } from '../../../../Domain/Enums/LedgerOperationType.js';
import { Chat } from '../../../../Domain/Aggregates/Chat.js';
import { IGroupRepository } from '../../../Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { ILedgerIdentity } from '../../../../Infrastructure/Interfaces/ILedgerIdentity.js';
import { MessageContract } from '../../../Contracts/Models/MessageContract.js';
import { IEventRepository } from '../../../Contracts/Providers/IEventRepository.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../Contracts/Repositories/IMediaStore.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { SendMessageCommand } from '../Contracts/SendMessage.js';
import { v4 as uuid } from 'uuid';

export class SendMessageCommandHandler implements Handler<SendMessageCommand, MessageContract> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
        private readonly messagePump: IPump,
        private readonly groupRepository: IGroupRepository,
        private readonly userRepository: IUserRepository,
        private readonly ledgerIdentity: ILedgerIdentity,
        private readonly ledgerPump: IPump,
    ) { }

    async handle(cmd: SendMessageCommand): Promise<Result<MessageContract>> {
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

        const chat = await this.chatStore.getChat(cmd.chatId);

        if (chat?.isGroup) {
            await this.queueGroupCreationIfDraft(chat);
        }

        await this.eventRepository.appendEvent(
            new MessageSentEvent(uuid().toString(), messageContract, cmd.connectionIds, cmd.participants, new Date()),
        );

        this.messagePump.notify();

        return Result.success(messageContract);
    }

    /**
     * The stream is created on the first message, so a group only reaches the server once there is
     * something to say in it.
     */
    private async queueGroupCreationIfDraft(chat: Chat): Promise<void> {
        const group = await this.groupRepository.get(chat.id);
        if (!group || group.lifecycle !== GroupLifecycle.Draft) return;

        const user = await this.userRepository.get(true);
        const identityKey = (await this.ledgerIdentity.publicKey()).toString('base64');

        await this.eventRepository.appendEvent(
            new LedgerOperationQueuedEvent(
                uuid().toString(),
                chat.id,
                {
                    type: LedgerOperationType.GroupCreated,
                    authorTag: user.userTag,
                    at: Date.now(),
                    name: chat.groupName ?? '',
                    owner: {
                        userTag: user.userTag,
                        displayName: user.displayName ?? user.username,
                        privilege: ChatPrivileges.Owner,
                        identityKey,
                    },
                },
                true,
                new Date(),
            ),
        );

        group.lifecycle = GroupLifecycle.Creating;
        await this.groupRepository.save(group);

        this.ledgerPump.notify();
    }
}
