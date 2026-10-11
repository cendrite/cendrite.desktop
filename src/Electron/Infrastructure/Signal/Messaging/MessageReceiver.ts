import { BrowserWindow } from 'electron';
import { ISessionManager } from '../../../Application/Contracts/Services/ISessionManager.js';
import { IChatStore } from '../../../Application/Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../Application/Contracts/Repositories/IMediaStore.js';
import { IMediaService } from '../../../Application/Services/Media/MediaService.js';
import { ServerMessage } from '../../../Application/Contracts/Messaging/ServerMessage.js';
import {
    DeliveryStatusPayload,
    GroupStrapPayload,
    MessagePayload,
    PayloadType,
} from '../../../Application/Contracts/Messaging/Payload.js';
import { Message } from '../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../Domain/Entities/MessageMedia.js';
import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';
import { MessageContract } from '../../../Application/Contracts/Models/MessageContract.js';
import { IFriendRepository } from '../../../Application/Contracts/Repositories/IFriendRepository.js';
import { IUserRepository } from '../../../Application/Contracts/Repositories/IUserRepository.js';
import { IGroupRepository } from '../../../Application/Contracts/Repositories/IGroupRepository.js';
import { IGroupKeyRepository } from '../../../Application/Contracts/Repositories/IGroupKeyRepository.js';
import { Group } from '../../../Domain/Entities/Group.js';
import { GroupEpochKey } from '../../../Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../Domain/Encryption/GroupWriteKey.js';
import { GroupLifecycle } from '../../../Domain/Enums/GroupLifecycle.js';
import { publicKeyFromPrivate } from '../../Crypto/LedgerCodec.js';
import { Chat } from '../../../Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../Domain/Entities/ChatMember.js';
import { ChatPrivileges } from '../../../Domain/Enums/ChatPrivileges.js';
import { v4 as uuid } from 'uuid';

export interface IMessageReceiver {
    handle(message: ServerMessage): void;
}

export class MessageReceiver implements IMessageReceiver {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
        private readonly mediaService: IMediaService,
        private readonly friendRepository: IFriendRepository,
        private readonly userRepository: IUserRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
        private readonly mainWindow: BrowserWindow,
    ) { }

    public async handle(message: ServerMessage): Promise<void> {
        const envelope = await this.sessionManager.decrypt(message.payload, message.senderId);

        for (const payload of envelope.payloads) {
            switch (payload.type) {
                case PayloadType.GroupCreated:
                    await this.handleGroupCreated(message, payload as GroupStrapPayload);
                    break;
                case PayloadType.ChatMessage:
                    await this.handleChatMessage(message, payload as MessagePayload);
                    break;
                case PayloadType.DeliveryStatus:
                    await this.handleDeliveryStatusUpdate(message, payload as DeliveryStatusPayload);
                    break;
                default:
                    console.warn(`Unhandled payload type ${payload.type}`);
                    break;
            }
        }
    }

    private async handleGroupCreated(message: ServerMessage, payload: GroupStrapPayload): Promise<void> {
        const existing = await this.chatStore.getChat(payload.groupId);
        if (existing) return;

        const user = await this.userRepository.get(true);

        if (!payload.members.some((member) => member.userTag === user.userTag)) {
            console.warn(`MessageReceiver: ${message.senderId} sent a group that does not list us, ignored`);
            return;
        }

        // Anyone can encrypt to us, so the group is only real if whoever sent it is in it.
        if (!payload.members.some((member) => member.connectionIds.includes(message.senderId))) {
            console.warn(`MessageReceiver: ${message.senderId} is not a member of ${payload.groupId}, ignored`);
            return;
        }

        const writeKeyPrivate = Buffer.from(payload.writeKeyPrivate, 'base64');

        await this.groupKeyRepository.saveWriteKey(
            new GroupWriteKey(payload.groupId, publicKeyFromPrivate(writeKeyPrivate), writeKeyPrivate),
        );

        for (const [index, epochKey] of payload.epochKeys.entries()) {
            await this.groupKeyRepository.saveEpochKey(
                new GroupEpochKey(payload.groupId, index + 1, Buffer.from(epochKey, 'base64')),
            );
        }

        const members = payload.members
            .filter((member) => member.userTag !== user.userTag)
            .map((member) =>
                ChatMember.createExternal(
                    uuid().toString(),
                    member.privilege,
                    member.userTag,
                    member.displayName,
                    member.connectionIds,
                ),
            );

        await this.chatStore.create(new Chat(payload.groupId, members, [], payload.groupName));

        await this.groupRepository.create(
            new Group(
                payload.groupId,
                GroupLifecycle.Active,
                payload.version,
                Buffer.from(payload.headHash, 'base64'),
                payload.epochKeys.length,
            ),
        );

        console.log(
            `MessageReceiver: joined group ${payload.groupId} from ${message.senderId} with ${members.length} other member(s)`,
        );
    }

    private async handleDeliveryStatusUpdate(message: ServerMessage, payload: DeliveryStatusPayload): Promise<void> {
        await this.chatStore.updateDeliveryStatus(payload.chatId, payload.messageIds, payload.deliveryStatus);

        console.log(
            `MessageReceiver: received delivery status update for chat ${payload.chatId} from ${message.senderId}`,
        );

        this.mainWindow.webContents.send('eventMessage', {
            kind: 'deliveryStatus',
            chatId: payload.chatId,
            messageIds: payload.messageIds,
            status: payload.deliveryStatus,
        });
    }

    private async handleChatMessage(message: ServerMessage, payload: MessagePayload): Promise<void> {
        const media = await this.mediaService.get(payload.media);

        for (const m of media) {
            await this.mediaStore.store(m.id, m.content);
        }

        await this.ensureChat(payload.chatId, payload);

        await this.chatStore.storeMessage(
            new Message(
                message.id,
                payload.chatId,
                message.senderId,
                message.timestamp,
                payload.text,
                media.map((m) => new MessageMedia(m.id, m.type, message.id)),
                DeliveryStatus.Received,
                message.messageToken,
            ),
        );

        console.log(
            `MessageReceiver: received message ${message.id} for chat ${payload.chatId} from ${message.senderId}`,
        );

        this.mainWindow.webContents.send('eventMessage', {
            kind: 'message',
            message: new MessageContract(
                message.id,
                payload.chatId,
                message.senderId,
                payload.text,
                message.timestamp,
                media,
                DeliveryStatus.Received,
                message.messageToken,
            ),
        });
    }

    private async ensureChat(chatId: string, payload: MessagePayload): Promise<void> {
        const existing = await this.chatStore.getChat(chatId);
        if (existing) return;

        const user = await this.userRepository.get(true);

        const friendTag = payload.participants.find((tag) => tag !== user.userTag);
        if (!friendTag) {
            throw new Error(`Cannot resolve a friend tag for chat ${chatId}`);
        }

        const friend = await this.friendRepository.getById(friendTag);
        if (!friend) {
            throw new Error(`Friend ${friendTag} not found, cannot create chat ${chatId}`);
        }

        const member = ChatMember.create(uuid().toString(), ChatPrivileges.Member, friend);
        await this.chatStore.create(new Chat(chatId, [member], []));
    }
}
