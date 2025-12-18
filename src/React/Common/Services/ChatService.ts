import { ChatViewModel } from '../../Models/ChatViewModel.ts';
import { Result } from '../../../Shared/Result/Result.ts';
import { CreateChatDto } from '../../../Electron/Application/Features/Chat/Commands/Create/CreateChatDto.ts';
import { CreateChatCommand } from '../../../Electron/Application/Features/Chat/Commands/Create/CreateChatCommand.ts';
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
import { MessagePayload, ServerChatMessage } from '../../SignalR/Messaging/ServerChatMessage.ts';
import { SessionManager } from '../../Security/Encryption/SessionManager.ts';

export class ChatService {
    private readonly messageSender = SignalManager.getInstance().getHandler<MessageHubHandler>('Messaging');

    public async sendMessage(
        userTag: string,
        userConnectionId: string,
        userExternalConnectionIds: string[],
        connectionIds: string[],
        recipientTags: string[],
        chatId: string,
        text: string | null,
        media: string | null,
    ): Promise<MessageViewModel | null> {
        if (!text && !media) return null;

        const message = MessageViewModel.create(chatId, userConnectionId, text, media);

        const participants = this.generateParticipantList(userTag, recipientTags);

        await this.addMessage(message, chatId);

        const messages: ServerChatMessage[] = [];

        const recieverIds = [...connectionIds, userExternalConnectionIds].flat();

        for (const connectionId of recieverIds) {
            const manager = new SessionManager(connectionId);
            const cipher = await manager.encrypt(new MessagePayload(message.text, message.media, participants));
            const msg = ServerChatMessage.create(message, connectionId, cipher);
            console.log(msg);
            messages.push(msg);
        }
        const receipt = await this.messageSender.sendMessage(messages);
        console.log('Message receipt:', receipt);
        return message;
    }

    public async createChat(user: User, contact: Contact): Promise<ChatViewModel> {
        const chatId = await this.deriveChatId(user.userTag, contact.id);
        const result = await window.electron.sendRequestAsync<Result<CreateChatDto>>(
            new CreateChatCommand(chatId, contact.id, uuid().toString(), ChatPrivileges.Admin),
        );

        if (!result.success) throw new Error('Failed to create chat');

        const memberDto = result.data!.member;
        const chatMember = new ChatMemberViewModel(memberDto.id, memberDto.privilege, memberDto.displayName, contact);

        return new ChatViewModel(result.data!.id, [chatMember]);
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

    private async addMessage(msg: MessageViewModel, chatId: string): Promise<void> {
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
