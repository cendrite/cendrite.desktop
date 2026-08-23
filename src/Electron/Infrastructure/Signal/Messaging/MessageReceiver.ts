import { BrowserWindow } from 'electron';
import { MessageHubHandler } from './MessageHubHandler.js';
import { ISessionManager } from '../../Interfaces/ISessionManager.js';
import { IChatStore } from '../../../Application/Contracts/Repositories/IChatStore.js';
import { IMediaStore } from '../../../Application/Contracts/Repositories/IMediaStore.js';
import { IMediaService } from '../../../Application/Services/Media/MediaService.js';
import { DeliveryStatusPayload, MessagePayload, PayloadType, ServerMessage } from './ServerMessage.js';
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
    ) { }


    public async handle(message: ServerMessage): Promise<void> {
        const envelope = await this.sessionManager.decrypt(message.payload, message.senderId);

        switch (envelope.payloadType) {
            case PayloadType.ChatMessage:
                await this.handleChatMessage(message, envelope.payload as MessagePayload);
                break;
            case PayloadType.DeliveryStatus:
                await this.handleDeliveryStatusUpdate(message, envelope.payload as DeliveryStatusPayload);
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
        const media = await this.mediaService.get(payload.media);

        for (const m of media) {
            await this.mediaStore.store(m.id, m.content);
        }

        await this.ensureChat(message.ChatId, payload);

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

    private async ensureChat(chatId: string, payload: MessagePayload): Promise<void> {
        const existing = await this.chatStore.getChat(chatId);
        if (existing) return;

        if (payload.participants.length > 2) {
            throw new Error(`Group chat creation is not implemented (chat ${chatId})`);
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
    }
}
