import { ChatViewModel } from '../../Models/ChatViewModel.ts';
import { Result } from '../../../Shared/Result/Result.ts';
import { CreateChatDto } from '../../../Electron/Application/Features/Chat/Commands/Create/CreateChatDto.ts';
import { CreateChatCommand } from '../../../Electron/Application/Features/Chat/Commands/Create/CreateChatCommand.ts';
import { DeleteChatCommand } from '../../../Electron/Application/Features/Chat/Commands/Delete/DeleteChatCommand.ts';
import { v4 as uuid } from 'uuid';
import { ChatPrivileges } from '../../../Electron/Domain/Enums/ChatPrivileges.ts';
import { ChatMemberViewModel } from '../../Models/ChatMemberViewModel.ts';
import { GetChatsQuery } from '../../../Electron/Application/Features/Chat/Queries/GetChats/GetChatsQuery.ts';
import { ChatDto } from '../../../Electron/Application/Features/Chat/Dtos/ChatDto.ts';
import { Contact } from '../../Models/Contact.ts';
import { User } from '../../Models/User.ts';
import { sha256 } from '../../../Shared/HelperFunctions.ts';
import { MessageViewModel } from '../../Models/MessageViewModel.ts';
import { AddMessageCommand } from '../../../Electron/Application/Features/Chat/Commands/AddMessage/AddMessageCommand.ts';
import { UpdateDeliveryStatusCommand } from '../../../Electron/Application/Features/Chat/Commands/UpdateDeliveryStatus/UpdateDeliveryStatusCommand.ts';
import { SessionManager } from '../../Security/Encryption/SessionManager.ts';
import { MessageDto } from '../../../Electron/Application/Features/Chat/Dtos/MessageDto.ts';
import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { MessagePayload, ServerMessage } from '../../SignalR/Messaging/ServerMessage.ts';
import { GetMessagesQuery } from '../../../Electron/Application/Features/Chat/Queries/GetMessages/GetMessagesQuery.ts';
import { Media } from '../../Models/Media.ts';
import { MediaService } from './MediaService.ts';
import { SendMessageCommand } from '../../../Electron/Application/Features/Chat/Contracts/SendMessage.ts';
import { Message } from '../../../Electron/Application/Contracts/Models/Message.ts';

export class ChatService {
    private readonly mediaService = new MediaService();

    public async sendMessage(
        user: User,
        connectionIds: string[],
        recipientTags: string[],
        chatId: string,
        text: string | null,
        media: Media[] = [],
    ): Promise<MessageViewModel | null> {
        if (!text && !media) return null;

        const messageResult = await window.electron.sendRequestAsync<Result<Message>>(
            new SendMessageCommand(
                chatId,
                uuid().toString(),
                user.connectionId,
                this.generateParticipantList(user.userTag, recipientTags),
                [...connectionIds, user.externalConnectionIds].flat(),
                text || '',
                media,
            ),
        );

        if (!messageResult.success) {
            console.error('Failed to send message:', messageResult.errorMessage);
            return null;
        }

        const message = MessageViewModel.mapFromContract(messageResult.data!);

        return message;
    }

    public async setDeliveryStatusOnReceipt(
        msg: MessageViewModel,
        receipt: DeliveryStatus | null | undefined,
    ): Promise<MessageViewModel> {
        console.log('Message delivery receipt:', receipt);
        msg.deliveryStatus = receipt ?? DeliveryStatus.Failed;
        await window.electron.sendRequestAsync(
            new UpdateDeliveryStatusCommand(msg.chatId, [msg.id], msg.deliveryStatus),
        );
        return msg;
    }

    public async updateDeliveryStatus(
        user: User,
        chat: ChatViewModel,
        deliveryStatus: DeliveryStatus,
    ): Promise<string[]> {
        const messageIds = chat.messages
            .filter(
                (m) =>
                    m.deliveryStatus !== DeliveryStatus.Read &&
                    m.senderId !== user.connectionId &&
                    !user.externalConnectionIds.includes(m.senderId),
            )
            .map((m) => m.id);

        if (messageIds.length === 0) return [];

        await window.electron.sendRequestAsync(new UpdateDeliveryStatusCommand(chat.id, messageIds, deliveryStatus));

        return messageIds;
    }

    public async deleteChat(chatId: string): Promise<void> {
        await window.electron.sendRequestAsync(new DeleteChatCommand(chatId));
    }

    public async initializeChat(user: User, contact: Contact): Promise<ChatViewModel> {
        const chatId = await this.deriveChatId(user.userTag, contact.id);
        const result = await window.electron.sendRequestAsync<Result<CreateChatDto>>(
            new CreateChatCommand(chatId, contact.id, uuid().toString(), ChatPrivileges.Admin),
        );

        if (!result.success) throw new Error('Failed to create chat');

        const memberDto = result.data!.member;
        const chatMember = new ChatMemberViewModel(memberDto.id, memberDto.privilege, memberDto.displayName, contact);

        return new ChatViewModel(result.data!.id, [chatMember]);
    }

    public async startChat(user: User, contacts: Contact[], msg: ServerMessage): Promise<ChatViewModel | null> {
        const sessionManager = new SessionManager(msg.senderId);
        const decryptedMessage = await sessionManager.decrypt<MessagePayload>(msg.payload);
        console.log('server message', msg);

        return decryptedMessage.participants.length > 2
            ? this.startGroupChat(user, contacts, msg, decryptedMessage)
            : this.startDirectChat(
                user,
                contacts.find((c) => c.id !== user.userTag),
                msg,
                decryptedMessage,
            );
    }

    public async addMessage(user: User, msg: ServerMessage, chatId: string): Promise<MessageViewModel> {
        const sessionManager = new SessionManager(msg.senderId);
        const decryptedMessage = await sessionManager.decrypt<MessagePayload>(msg.payload);
        const media = await this.mediaService.getMedia(decryptedMessage.media);
        const mappedMsg = MessageViewModel.mapFromDecrypted(
            msg,
            decryptedMessage,
            this.getInitialDeliveryStatus(user, msg.senderId),
            media,
        );
        await this.persistMessage(mappedMsg, chatId);
        return mappedMsg;
    }

    public async getChats(contacts: Contact[]): Promise<ChatViewModel[]> {
        const chatsResult = await window.electron.sendRequestAsync<Result<ChatDto[]>>(new GetChatsQuery(30, 20));

        if (!chatsResult.success) {
            throw new Error('Failed to get chats');
        }

        return chatsResult.data!.map((chatDto) => {
            const members = chatDto.members.flatMap((memberDto) => {
                const contact = contacts.find((c) => c.id === memberDto.friendId);
                if (!contact) return [];

                return [new ChatMemberViewModel(memberDto.id, memberDto.privilege, memberDto.displayName, contact)];
            });

            const messages = chatDto.messages.map((msgDto) => MessageViewModel.mapFromDto(chatDto.id, msgDto));

            return new ChatViewModel(
                chatDto.id,
                members,
                messages,
                chatDto.muted,
                chatDto.muteTimer ? new Date(chatDto.muteTimer) : null,
            );
        });
    }

    public async getMessages(chatId: string, offset: number, take: number): Promise<MessageViewModel[]> {
        const messages = await window.electron.sendRequestAsync<Result<MessageDto[]>>(
            new GetMessagesQuery(chatId, offset, take),
        );

        if (!messages.success) {
            throw new Error('Failed to get messages');
        }

        console.log('Fetched messages:', messages.data);
        return messages.data!.map((dto) => MessageViewModel.mapFromDto(chatId, dto));
    }

    public async deriveChatId(a: string, b: string): Promise<string> {
        const [sh, lo] = [a, b].sort();
        const input = `cypherly:dm:${sh}:${lo}`;
        return await sha256(input);
    }

    private async startGroupChat(
        _user: User,
        _contacts: Contact[],
        _msg: ServerMessage,
        _content: MessagePayload,
    ): Promise<ChatViewModel> {
        throw new Error('Not implemented');
    }

    private async startDirectChat(
        user: User,
        contact: Contact | undefined,
        msg: ServerMessage,
        content: MessagePayload,
    ): Promise<ChatViewModel | null> {
        if (!contact) {
            console.warn(`Contact with ID ${msg.senderId} not found.`);
            return null;
        }

        const member = new ChatMemberViewModel(uuid().toString(), ChatPrivileges.Member, contact.displayName, contact);

        const mappedMsg = MessageViewModel.mapFromDecrypted(
            msg,
            content,
            this.getInitialDeliveryStatus(user, msg.senderId),
        );
        const chat = new ChatViewModel(msg.ChatId, [member], [mappedMsg]);

        await window.electron.sendRequestAsync(
            new CreateChatCommand(
                chat.id,
                contact.id,
                member.id,
                member.privilege,
                new MessageDto(
                    mappedMsg.id,
                    mappedMsg.messageToken,
                    mappedMsg.senderId,
                    mappedMsg.text,
                    mappedMsg.date,
                    mappedMsg.media,
                    mappedMsg.deliveryStatus,
                ),
            ),
        );
        return chat;
    }

    private getInitialDeliveryStatus(user: User, senderId: string): DeliveryStatus {
        return user.IsUserConnectionId(senderId) ? DeliveryStatus.Sent : DeliveryStatus.Received;
    }

    private async persistMessage(msg: MessageViewModel, chatId: string): Promise<void> {
        await window.electron.sendRequestAsync(
            new AddMessageCommand(
                chatId,
                msg.id,
                msg.senderId,
                msg.date,
                msg.deliveryStatus,
                msg.messageToken,
                msg.text,
                msg.media,
            ),
        );
    }

    private generateParticipantList(userTag: string, friendIds: string[]): string[] {
        const participantIds = new Set<string>();
        friendIds.forEach((id) => {
            participantIds.add(id);
        });
        participantIds.add(userTag);
        return Array.from(participantIds);
    }
}
