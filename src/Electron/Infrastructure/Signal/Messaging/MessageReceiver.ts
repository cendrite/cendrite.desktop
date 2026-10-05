import { BrowserWindow } from 'electron';
import { ISessionManager } from '../../../Application/Contracts/Services/ISessionManager.js';
import { IChatStore } from '../../../Application/Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../Application/Contracts/Repositories/IMediaStore.js';
import { IMediaService } from '../../../Application/Services/Media/MediaService.js';
import { ServerMessage } from '../../../Application/Contracts/Messaging/ServerMessage.js';
import {
    DeliveryStatusPayload,
    GroupCreatedPayload,
    LedgerAdvancedPayload,
    MessagePayload,
    PayloadType,
} from '../../../Application/Contracts/Messaging/Envelope.js';
import { IGroupJoinService } from '../../../Application/Contracts/Services/IGroupJoinService.js';
import { IGroupMembershipGuard } from '../../../Application/Contracts/Services/IGroupMembershipGuard.js';
import { Message } from '../../../Domain/Entities/Message.js';
import { MessageMedia } from '../../../Domain/Entities/MessageMedia.js';
import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';
import { MessageContract } from '../../../Application/Contracts/Models/MessageContract.js';
import { IFriendRepository } from '../../../Application/Contracts/Repositories/IFriendRepository.js';
import { IUserRepository } from '../../../Application/Contracts/Repositories/IUserRepository.js';
import { Chat } from '../../../Domain/Aggregates/Chat.js';
import { ChatMember } from '../../../Domain/Entities/ChatMember.js';
import { ChatPrivileges } from '../../../Domain/Enums/ChatPrivileges.js';
import { v4 as uuid } from 'uuid';
import { tag } from '../../../Utilities.js';

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
        private readonly mainWindow: BrowserWindow,
        private readonly groupJoinService: IGroupJoinService,
        private readonly groupMembershipGuard: IGroupMembershipGuard,
    ) { }


    public async handle(message: ServerMessage): Promise<void> {
        try {
            await this.dispatch(message);
        } catch (error) {
            console.error(`MessageReceiver: failed to handle message ${message.id}`, error);
        }
    }

    private async dispatch(message: ServerMessage): Promise<void> {
        const envelope = await this.sessionManager.decrypt(message.payload, message.senderId);

        console.log(`${tag()} wire: received type ${envelope.payloadType} from ${message.senderId}`);

        switch (envelope.payloadType) {
            case PayloadType.ChatMessage:
                await this.handleChatMessage(message, envelope.payload as MessagePayload);
                break;
            case PayloadType.DeliveryStatus:
                await this.handleDeliveryStatusUpdate(message, envelope.payload as DeliveryStatusPayload);
                break;
            case PayloadType.GroupCreated:
                await this.groupJoinService.join(envelope.payload as GroupCreatedPayload, message.senderId);
                break;
            case PayloadType.LedgerAdvanced:
                await this.groupJoinService.catchUp(envelope.payload as LedgerAdvancedPayload);
                break;
            default:
                console.warn(`Unhandled payload type ${envelope.payloadType}`);
                break;
        }
    }

    private async handleDeliveryStatusUpdate(message: ServerMessage, payload: DeliveryStatusPayload): Promise<void> {
        await this.chatStore.updateDeliveryStatus(message.ChatId, payload.messageIds, payload.deliveryStatus);

        console.log(
            `MessageReceiver: received delivery status update for chat ${message.ChatId} from ${message.senderId}`,
        );

        this.mainWindow.webContents.send('eventMessage', {
            kind: 'deliveryStatus',
            chatId: message.ChatId,
            messageIds: payload.messageIds,
            status: payload.deliveryStatus,
        });
    }

    private async handleChatMessage(message: ServerMessage, payload: MessagePayload): Promise<void> {
        console.log(
            `${tag()} recv: message ${message.id} for chat ${message.ChatId} carries groupId ${payload.groupId ?? 'null'}`,
        );

        // Removal is enforced here: the server will still carry a removed member's messages, clients ignore them.
        if (payload.groupId && !(await this.isGroupMember(payload.groupId, message.senderId, payload.participants))) {
            console.warn(
                `${tag()} group: dropped message from ${message.senderId}, ledger does not list that device in ${payload.groupId}`,
            );
            return;
        }

        const media = await this.mediaService.get(payload.media);

        for (const m of media) {
            await this.mediaStore.store(m.id, m.content);
        }

        // A message can outrun its own invite, and there is nowhere to put it until the chat exists.
        if (!(await this.ensureChat(message.ChatId, payload))) {
            console.warn(`MessageReceiver: no chat for ${message.ChatId} yet, dropping message ${message.id}`);
            return;
        }

        await this.chatStore.storeMessage(
            new Message(
                message.id,
                message.ChatId,
                message.senderId,
                message.timestamp,
                payload.text,
                media.map((m) => new MessageMedia(m.id, m.type, message.id)),
                DeliveryStatus.Received,
                message.messageToken,
            ),
        );

        console.log(
            `MessageReceiver: received message ${message.id} for chat ${message.ChatId} from ${message.senderId}`,
        );

        this.mainWindow.webContents.send('eventMessage', {
            kind: 'message',
            message: new MessageContract(
                message.id,
                message.ChatId,
                message.senderId,
                payload.text,
                message.timestamp,
                media,
                DeliveryStatus.Received,
                message.messageToken,
            ),
        });
    }

    private async ensureChat(chatId: string, payload: MessagePayload): Promise<boolean> {
        const existing = await this.chatStore.getChat(chatId);
        if (existing) return true;

        // A group chat arrives with GroupCreated, which the creator sends before the first message.
        if (payload.groupId) {
            console.warn(`${tag()} group: message for ${payload.groupId} arrived before GroupCreated`);
            return false;
        }

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

        return true;
    }

    /** The group was created before the message was sent, so a miss means a genuine membership change. */
    private async isGroupMember(groupId: string, connectionId: string, participants: string[]): Promise<boolean> {
        if (await this.groupMembershipGuard.isMember(groupId, connectionId)) return true;

        await this.groupJoinService.catchUp(new LedgerAdvancedPayload(groupId, 0, '', participants));

        return this.groupMembershipGuard.isMember(groupId, connectionId);
    }
}
