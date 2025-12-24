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
import { MessageHubHandler } from '../../SignalR/Messaging/MessageHubHandler.ts';
import { SignalManager } from '../../SignalR/SignalManager.ts';
import { AddMessageCommand } from '../../../Electron/Application/Features/Chat/Commands/AddMessage/AddMessageCommand.ts';
import { UpdateDeliveryStatusCommand } from '../../../Electron/Application/Features/Chat/Commands/UpdateDeliveryStatus/UpdateDeliveryStatusCommand.ts';
import { MessagePayload, ServerChatMessage } from '../../SignalR/Messaging/ServerChatMessage.ts';
import { SessionManager } from '../../Security/Encryption/SessionManager.ts';
import { MessageDto } from '../../../Electron/Application/Features/Chat/Dtos/MessageDto.ts';
import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus.ts';

export class ChatService {
    private readonly messageSender = SignalManager.getInstance().getHandler<MessageHubHandler>('Messaging');

    public async sendMessage(
        user: User,
        connectionIds: string[],
        recipientTags: string[],
        chatId: string,
        text: string | null,
        media: string | null,
    ): Promise<MessageViewModel | null> {
        if (!text && !media) return null;

        const message = MessageViewModel.create(chatId, user.connectionId, text, media, DeliveryStatus.Pending);

        const participants = this.generateParticipantList(user.userTag, recipientTags);

        await this.persistMessage(message, chatId);

        const messages: ServerChatMessage[] = [];

        const recieverIds = [...connectionIds, user.externalConnectionIds].flat();

        for (const connectionId of recieverIds) {
            const manager = new SessionManager(connectionId);
            const cipher = await manager.encrypt(
                new MessagePayload(message.text, message.media, participants, DeliveryStatus.Pending),
            );
            const msg = ServerChatMessage.create(message, connectionId, cipher);
            messages.push(msg);
        }

        const receipt = await this.messageSender.sendMessage(messages);
        console.log('Message send receipt:', receipt);
        const msg = this.setDeliveryStatusOnReceipt(message, receipt);
        return msg;
    }

    private async setDeliveryStatusOnReceipt(
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

    public async startChat(user: User, contacts: Contact[], msg: ServerChatMessage): Promise<ChatViewModel | null> {
        const sessionManager = new SessionManager(msg.senderId);
        const decryptedMessage = await sessionManager.decrypt(msg.content);

        return decryptedMessage.participants.length > 2
            ? this.startGroupChat(contacts, msg, decryptedMessage)
            : this.startDirectChat(
                contacts.find((c) => c.id !== user.userTag),
                msg,
                decryptedMessage,
            );
    }

    public async addMessage(msg: ServerChatMessage, chatId: string): Promise<MessageViewModel> {
        const sessionManager = new SessionManager(msg.senderId);
        const decryptedMessage = await sessionManager.decrypt(msg.content);
        const mappedMsg = MessageViewModel.mapFromDecrypted(msg, decryptedMessage);
        await this.persistMessage(mappedMsg, chatId);
        return mappedMsg;
    }

    public async getChats(contacts: Contact[]): Promise<ChatViewModel[]> {
        const chatsResult = await window.electron.sendRequestAsync<Result<ChatDto[]>>(new GetChatsQuery(30, 10));

        if (!chatsResult.success) {
            throw new Error('Failed to get chats');
        }

        return chatsResult.data!.map((chatDto) => {
            const members = chatDto.members.flatMap((memberDto) => {
                const contact = contacts.find((c) => c.id === memberDto.friendId);
                if (!contact) return [];

                return [new ChatMemberViewModel(memberDto.id, memberDto.privilege, memberDto.displayName, contact)];
            });

            const messages = chatDto.messages.map(
                (msgDto) =>
                    new MessageViewModel(
                        msgDto.id,
                        chatDto.id,
                        msgDto.senderId,
                        msgDto.content,
                        new Date(msgDto.timestamp),
                        msgDto.deliveryStatus,
                        msgDto.contentUrl,
                    ),
            );

            return new ChatViewModel(
                chatDto.id,
                members,
                messages,
                chatDto.muted,
                chatDto.muteTimer ? new Date(chatDto.muteTimer) : null,
            );
        });
    }

    public async deriveChatId(a: string, b: string): Promise<string> {
        const [sh, lo] = [a, b].sort();
        const input = `cypherly:dm:${sh}:${lo}`;
        return await sha256(input);
    }

    private async startGroupChat(
        _contacts: Contact[],
        _msg: ServerChatMessage,
        _content: MessagePayload,
    ): Promise<ChatViewModel> {
        throw new Error('Not implemented');
    }

    private async startDirectChat(
        contact: Contact | undefined,
        msg: ServerChatMessage,
        content: MessagePayload,
    ): Promise<ChatViewModel | null> {
        if (!contact) {
            console.warn(`Contact with ID ${msg.senderId} not found.`);
            return null;
        }
        const member = new ChatMemberViewModel(uuid().toString(), ChatPrivileges.Member, contact.displayName, contact);
        const mappedMsg = MessageViewModel.mapFromDecrypted(msg, content);
        const chat = new ChatViewModel(msg.chatId, [member], [mappedMsg]);

        await window.electron.sendRequestAsync(
            new CreateChatCommand(
                chat.id,
                contact.id,
                member.id,
                member.privilege,
                new MessageDto(
                    mappedMsg.id,
                    null,
                    mappedMsg.senderId,
                    mappedMsg.text,
                    mappedMsg.media,
                    mappedMsg.date,
                    mappedMsg.deliveryStatus,
                ),
            ),
        );
        return chat;
    }

    private async persistMessage(msg: MessageViewModel, chatId: string): Promise<void> {
        await window.electron.sendRequestAsync(
            new AddMessageCommand(
                chatId,
                msg.id,
                msg.senderId,
                msg.text,
                msg.date,
                msg.deliveryStatus,
                msg.media,
                msg.messageToken,
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
