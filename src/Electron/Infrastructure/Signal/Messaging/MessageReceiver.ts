import { BrowserWindow } from 'electron';
import { ISessionManager } from '#electron/Application/Contracts/Services/ISessionManager';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IMediaStore } from '#electron/Application/Contracts/Repositories/IMediaStore';
import { IMediaService } from '#electron/Application/Services/Media/MediaService';
import { ServerMessage } from '#electron/Application/Contracts/Services/IMessageHubHandler';
import {
    DeliveryStatusPayload,
    GroupStrapPayload,
    MessagePayload,
    PayloadType,
} from '#electron/Domain/Protocol/Payload';
import { Message } from '#electron/Domain/Entities/Message';
import { MessageMedia } from '#electron/Domain/Entities/MessageMedia';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { MessageContract } from '#shared/Models/MessageContract';
import { IFriendRepository } from '#electron/Application/Contracts/Repositories/IFriendRepository';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { publicKeyFromPrivate } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { Chat } from '#electron/Domain/Aggregates/Chat';
import { ChatMember } from '#electron/Domain/Entities/ChatMember';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
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
                    console.log(`MessageReceiver: received group creation for from ${message.senderId}`);
                    await this.handleGroupCreated(message, payload as GroupStrapPayload);
                    break;
                case PayloadType.ChatMessage:
                    console.log(`MessageReceiver: received chat message from ${message.senderId}`);
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
                    member.avatarKey,
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
                payload.messageId,
                payload.chatId,
                message.senderId,
                message.timestamp,
                payload.text,
                media.map((m) => new MessageMedia(m.id, m.type, payload.messageId)),
                DeliveryStatus.Received,
                payload.messageToken,
            ),
        );

        console.log(
            `MessageReceiver: received message ${message.id} for chat ${payload.chatId} from ${message.senderId}`,
        );

        this.mainWindow.webContents.send('eventMessage', {
            kind: 'message',
            message: new MessageContract(
                payload.messageId,
                payload.chatId,
                message.senderId,
                payload.text,
                message.timestamp,
                media,
                DeliveryStatus.Received,
                payload.messageToken,
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
