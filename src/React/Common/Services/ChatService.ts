import { ChatViewModel } from '../../Models/ChatViewModel.ts';
import { Result } from '../../../Shared/Result/Result.ts';
import { CreateChatCommand } from '../../../Electron/Application/Features/Chat/Contracts/CreateChat.ts';
import { ChatContract } from '../../../Electron/Application/Contracts/Models/ChatContract.ts';
import { DeleteChatCommand } from '../../../Electron/Application/Features/Chat/Contracts/DeleteChat.ts';
import { v4 as uuid } from 'uuid';
import { ChatPrivileges } from '../../../Electron/Domain/Enums/ChatPrivileges.ts';
import { ChatMemberViewModel } from '../../Models/ChatMemberViewModel.ts';
import { GetChatsQuery } from '../../../Electron/Application/Features/Chat/Contracts/GetChats.ts';
import { Contact } from '../../Models/Contact.ts';
import { User } from '../../Models/User.ts';
import { sha256 } from '../../../Shared/HelperFunctions.ts';
import { MessageViewModel } from '../../Models/MessageViewModel.ts';
import { DeliveryStatus } from '../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { GetMessagesQuery } from '../../../Electron/Application/Features/Chat/Contracts/GetMessages.ts';
import { Media } from '../../Models/Media.ts';
import { SendMessageCommand } from '../../../Electron/Application/Features/Chat/Contracts/SendMessage.ts';
import { ResendMessageCommand } from '../../../Electron/Application/Features/Chat/Contracts/ResendMessage.ts';
import { MessageContract } from '../../../Electron/Application/Contracts/Models/MessageContract.ts';
import { UpdateDeliveryStatusCommand } from '../../../Electron/Application/Features/Chat/Contracts/UpdateDeliveryStatus.ts';

export class ChatService {
    public async sendMessage(
        user: User,
        connectionIds: string[],
        recipientTags: string[],
        chatId: string,
        text: string | null,
        media: Media[] = [],
        isGroup: boolean = false,
    ): Promise<MessageViewModel | null> {
        if (!text && !media) return null;

        const messageResult = await window.electron.sendRequestAsync<Result<MessageContract>>(
            new SendMessageCommand(
                chatId,
                uuid().toString(),
                user.connectionId,
                this.generateParticipantList(user.userTag, recipientTags),
                [...connectionIds, user.externalConnectionIds].flat(),
                text || '',
                media,
                isGroup,
            ),
        );

        if (!messageResult.success) {
            console.error('Failed to send message:', messageResult.errorMessage);
            return null;
        }

        const message = MessageViewModel.mapFromContract(messageResult.data!);

        return message;
    }

    public async resendMessage(chatId: string, messageId: string, connectionIds: string[], recipientTags: string[]) {
        const result = await window.electron.sendRequestAsync<Result<void>>(
            new ResendMessageCommand(chatId, messageId, connectionIds, recipientTags),
        );

        if (!result.success) {
            console.error('Failed to resend message:', result.errorMessage);
        }
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
                    m.deliveryStatus === DeliveryStatus.Received &&
                    m.senderId !== user.connectionId &&
                    !user.externalConnectionIds.includes(m.senderId),
            )
            .map((m) => m.id);

        if (messageIds.length === 0) return [];

        await window.electron.sendRequestAsync(
            new UpdateDeliveryStatusCommand(
                chat.id,
                user.connectionId,
                messageIds,
                chat.chatMembers.map((m) => m.devices).flat(),
                chat.chatMembers.map((m) => m.userTag),
                deliveryStatus,
            ),
        );

        return messageIds;
    }

    public async deleteChat(chatId: string): Promise<void> {
        await window.electron.sendRequestAsync(new DeleteChatCommand(chatId));
    }

    public async initializeChat(user: User, contact: Contact): Promise<ChatViewModel> {
        const chatId = await this.deriveChatId(user.userTag, contact.id);
        const result = await window.electron.sendRequestAsync<Result<ChatContract>>(
            new CreateChatCommand(chatId, [contact.id],  ChatPrivileges.Admin),
        );

        if (!result.success) throw new Error('Failed to create chat');

        const memberDto = result.data!.members[0];
        const chatMember = new ChatMemberViewModel(
            memberDto.id,
            memberDto.privelege,
            memberDto.displayName,
            memberDto.userTag,
            memberDto.connectionsIds ?? [],
            contact,
        );

        return new ChatViewModel(result.data!.id, [chatMember]);
    }

    public async createGroupChat(contacts: Contact[], groupName: string | null): Promise<ChatViewModel> {
        const chatId = uuid().toString();

        const result = await window.electron.sendRequestAsync<Result<ChatContract>>(
            new CreateChatCommand(
                chatId,
                contacts.map((c) => c.id),
                ChatPrivileges.Admin,
                groupName,
                true,
            ),
        );

        if (!result.success) throw new Error('Failed to create group chat');

        const members = result.data!.members.map((memberDto) => {
            const contact = contacts.find((c) => c.id === memberDto.friendId) ?? null;

            return new ChatMemberViewModel(
                memberDto.id,
                memberDto.privelege,
                memberDto.displayName,
                memberDto.userTag,
                memberDto.connectionsIds ?? [],
                contact,
            );
        });

        return new ChatViewModel(result.data!.id, members, [], true, groupName);
    }

    public async getChats(contacts: Contact[]): Promise<ChatViewModel[]> {
        const chatsResult = await window.electron.sendRequestAsync<Result<ChatContract[]>>(new GetChatsQuery(30, 20));

        if (!chatsResult.success) {
            throw new Error('Failed to get chats');
        }

        return chatsResult.data!.map((chatDto) => {
            const members = chatDto.members.map((memberDto) => {
                const contact = contacts.find((c) => c.id === memberDto.friendId) ?? null;

                return new ChatMemberViewModel(
                    memberDto.id,
                    memberDto.privelege,
                    memberDto.displayName,
                    memberDto.userTag,
                    memberDto.connectionsIds ?? [],
                    contact,
                );
            });

            const messages = chatDto.messages.map((msgDto) => MessageViewModel.mapFromContract(msgDto));

            return new ChatViewModel(
                chatDto.id,
                members,
                messages,
                chatDto.isGroup,
                chatDto.groupName,
                chatDto.muted,
                chatDto.muteTimer ? new Date(chatDto.muteTimer) : null,
            );
        });
    }

    public async getMessages(chatId: string, offset: number, take: number): Promise<MessageViewModel[]> {
        const messages = await window.electron.sendRequestAsync<Result<MessageContract[]>>(
            new GetMessagesQuery(chatId, offset, take),
        );

        if (!messages.success) {
            throw new Error('Failed to get messages');
        }

        return messages.data!.map((c) => MessageViewModel.mapFromContract(c));
    }

    public async deriveChatId(a: string, b: string): Promise<string> {
        const [sh, lo] = [a, b].sort();
        const input = `cypherly:dm:${sh}:${lo}`;
        return await sha256(input);
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
