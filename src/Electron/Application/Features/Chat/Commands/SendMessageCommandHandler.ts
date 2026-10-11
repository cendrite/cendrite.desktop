import { Result } from '../../../../../Shared/Result/Result.js';
import { Message } from '../../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../../Domain/Entities/MessageMedia.js';
import { ChatPrivileges } from '../../../../Domain/Enums/ChatPrivileges.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { GroupLifecycle } from '../../../../Domain/Enums/GroupLifecycle.js';
import { MessageSentEvent } from '../../../../Domain/Events/MessageSentEvent.js';
import { GroupCreatedOperation, GroupMemberRef } from '../../../../Domain/Operations/LedgerOperation.js';
import { Group } from '../../../../Domain/Entities/Group.js';
import { GroupStrapPayload, Payload } from '../../../Contracts/Messaging/Payload.js';
import { generateWriteKeyPair, WriteKeyPair } from '../../../../Infrastructure/Crypto/LedgerCodec.js';
import { ILedgerIdentity } from '../../../../Infrastructure/Interfaces/ILedgerIdentity.js';
import { IGroupKeyRepository } from '../../../Contracts/Repositories/IGroupKeyRepository.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { IDeviceRepository } from '../../../Contracts/Repositories/IDeviceRepository.js';
import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
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
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly ledgerIdentity: ILedgerIdentity,
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository,
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

        let payloads: Record<string, Payload[]> = {};

        if (cmd.isGroup) {
            const group = await this.groupRepository.get(cmd.chatId);
            if (!group) {
                throw new Error(`Group with ID ${cmd.chatId} not found`);
            }

            if (group.lifecycle === GroupLifecycle.Draft) {
                const created = await this.createStream(group);
                if (!created.success) return Result.fail<MessageContract>(created.errorMessage!);

                payloads = created.data!;
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
            new MessageSentEvent(
                uuid().toString(),
                messageContract,
                cmd.connectionIds,
                cmd.participants,
                new Date(),
                payloads,
            ),
        );

        this.messagePump.notify();

        return Result.success(messageContract);
    }

    private async createStream(group: Group): Promise<Result<Record<string, Payload[]>>> {
        const chat = await this.chatStore.getChatWithMembers(group.groupId);
        const user = await this.userRepository.get(true);
        const device = await this.deviceRepository.get();

        if (!device) throw new Error('No local device registered');

        const ownWriteKey = await this.groupKeyRepository.getWriteKey(group.groupId);
        const epochKey = await this.groupKeyRepository.getEpochKey(group.groupId, group.epoch);

        if (!ownWriteKey || !epochKey) {
            throw new Error(`Group ${group.groupId} has no keys`);
        }

        const minted = new Map<string, WriteKeyPair>();

        const members: GroupMemberRef[] = [
            new GroupMemberRef(
                user.userTag,
                user.displayName ?? user.username,
                ChatPrivileges.Owner,
                user.avatarKey,
                (await this.ledgerIdentity.publicKey()).toString('base64'),
                ownWriteKey.publicKey.toString('base64'),
                [...new Set([device.connectionId, ...(user.connectionIds ?? []).map((c) => c.connectionId)])],
            ),
        ];

        for (const member of chat.members) {
            const writeKey = generateWriteKeyPair();
            minted.set(member.userTag, writeKey);

            members.push(
                new GroupMemberRef(
                    member.userTag,
                    member.displayName,
                    ChatPrivileges.Member,
                    member.friend!.avatarKey,
                    '',
                    writeKey.publicKey.toString('base64'),
                    member.devices,
                ),
            );
        }

        const created = await this.ledgerWriter.createStream(
            group.groupId,
            members.map((member) => Buffer.from(member.writeKeyPublic, 'base64')),
            new GroupCreatedOperation(user.userTag, chat.groupName, members),
        );

        if (!created.success) {
            return Result.fail<Record<string, Payload[]>>(
                created.errorMessage ?? new ErrorMessage('SendMessage', 'Could not create the group stream.'),
            );
        }

        const payloads: Record<string, Payload[]> = {};

        for (const member of chat.members) {
            const strap = new GroupStrapPayload(
                group.groupId,
                chat.groupName,
                1,
                created.data!.toString('base64'),
                [epochKey.key.toString('base64')],
                minted.get(member.userTag)!.privateKey.toString('base64'),
                members,
            );

            for (const connectionId of member.devices) {
                payloads[connectionId] = [strap];
            }
        }

        group.lifecycle = GroupLifecycle.Active;
        await this.groupRepository.update(group);

        return Result.success(payloads);
    }
}
