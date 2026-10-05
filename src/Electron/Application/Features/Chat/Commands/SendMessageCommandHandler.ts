import { Result } from '../../../../../Shared/Result/Result.js';
import { Message } from '../../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../../Domain/Entities/MessageMedia.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { LedgerOperationQueuedEvent } from '../../../../Domain/Events/LedgerOperationQueuedEvent.js';
import { EnvelopeQueuedEvent } from '../../../../Domain/Events/EnvelopeQueuedEvent.js';
import { GroupCreatedPayload, PayloadType } from '../../../Contracts/Messaging/Envelope.js';
import { GroupMemberRef } from '../../../../Domain/Operations/LedgerOperation.js';
import { generateWriteKeyPair, WriteKeyPair } from '../../../../Infrastructure/Crypto/LedgerCodec.js';
import { IGroupKeyRepository } from '../../../Contracts/Repositories/IGroupKeyRepository.js';
import { IDeviceRepository } from '../../../Contracts/Repositories/IDeviceRepository.js';
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
import { tag } from '../../../../Utilities.js';

export class SendMessageCommandHandler implements Handler<SendMessageCommand, MessageContract> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
        private readonly groupRepository: IGroupRepository,
        private readonly userRepository: IUserRepository,
        private readonly ledgerIdentity: ILedgerIdentity,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly outboxPump: IPump,
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

        this.outboxPump.notify();

        return Result.success(messageContract);
    }

    /**
     * The stream is created on the first message, so a group only reaches the server once there is
     * something to say in it. Everything a member needs is minted here and sent in one go: no member
     * has to answer, and nothing has to arrive in a particular order between clients.
     */
    private async queueGroupCreationIfDraft(chat: Chat): Promise<void> {
        const group = await this.groupRepository.get(chat.id);
        if (!group || group.lifecycle !== GroupLifecycle.Draft) {
            console.log(
                `${tag()} group: ${chat.id} is ${group ? GroupLifecycle[group.lifecycle] : 'unknown'}, not queueing a create`,
            );
            return;
        }

        const withMembers = await this.chatStore.getChatWithMembers(chat.id);
        if (!withMembers) throw new Error(`Cannot create group ${chat.id} without its members`);

        const user = await this.userRepository.get(true);
        const device = await this.deviceRepository.get();
        if (!device) throw new Error('No local device registered');

        const ownWriteKey = await this.groupKeyRepository.getWriteKey(chat.id);
        if (!ownWriteKey) throw new Error(`No write key for group ${chat.id}`);

        const epochKey = await this.groupKeyRepository.getEpochKey(chat.id, group.epoch);
        if (!epochKey) throw new Error(`No epoch key for group ${chat.id}`);

        const ownDevices = [
            ...new Set([device.connectionId, ...(user.connectionIds ?? []).map((c) => c.connectionId)]),
        ];

        const creator: GroupMemberRef = {
            userTag: user.userTag,
            displayName: user.displayName ?? user.username,
            privilege: ChatPrivileges.Owner,
            identityKey: (await this.ledgerIdentity.publicKey()).toString('base64'),
            writeKeyPublic: ownWriteKey.publicKey.toString('base64'),
            connectionIds: ownDevices,
        };

        // Minted by us, so a member holds a write key the moment it hears about the group.
        const minted = new Map<string, WriteKeyPair>();
        const members: GroupMemberRef[] = [creator];

        for (const member of withMembers.members) {
            const writeKey = generateWriteKeyPair();
            minted.set(member.userTag, writeKey);

            members.push({
                userTag: member.userTag,
                displayName: member.displayName ?? member.userTag,
                privilege: member.privilege,
                identityKey: await this.peerIdentityKey(member.devices),
                writeKeyPublic: writeKey.publicKey.toString('base64'),
                connectionIds: member.devices,
            });
        }

        await this.eventRepository.appendEvent(
            new LedgerOperationQueuedEvent(
                uuid().toString(),
                chat.id,
                {
                    type: LedgerOperationType.GroupCreated,
                    authorTag: user.userTag,
                    at: Date.now(),
                    name: chat.groupName ?? '',
                    members,
                },
                true,
                new Date(),
            ),
        );

        const participants = members.map((member) => member.userTag);

        for (const member of withMembers.members) {
            if (member.devices.length === 0) {
                console.warn(`${tag()} group: ${member.userTag} has no known devices, cannot tell them about ${chat.id}`);
                continue;
            }

            await this.eventRepository.appendEvent(
                new EnvelopeQueuedEvent(
                    uuid().toString(),
                    PayloadType.GroupCreated,
                    new GroupCreatedPayload(
                        chat.id,
                        chat.groupName ?? '',
                        group.epoch,
                        epochKey.key.toString('base64'),
                        minted.get(member.userTag)!.privateKey.toString('base64'),
                        members,
                        participants,
                    ),
                    member.devices,
                    new Date(),
                ),
            );
        }

        group.lifecycle = GroupLifecycle.Active;
        await this.groupRepository.save(group);

        console.log(
            `${tag()} group: queued creation of ${chat.id} with ${members.length} member(s) and ${withMembers.members.length} envelope(s)`,
        );
    }

    private async peerIdentityKey(devices: string[]): Promise<string> {
        for (const connectionId of devices) {
            const key = await this.ledgerIdentity.peerPublicKey(connectionId);
            if (key) return key.toString('base64');
        }

        // Unknown until they first author something, which pins it then.
        return '';
    }
}
