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

export class ChatService {
    public async createChat(user: User, contact: Contact): Promise<ChatViewModel> {
        const chatId = await this.deriveChatId(user.userTag, contact.id);

        const command = new CreateChatCommand(chatId, contact.id, uuid().toString(), ChatPrivileges.Admin);

        const result = await window.electron.sendRequestAsync<Result<CreateChatDto>>(command);

        if (result.success) {
            const memberDto = result.data!.member;
            const chatMember = new ChatMemberViewModel(
                memberDto.id,
                memberDto.privilege,
                memberDto.displayName,
                contact,
            );

            return new ChatViewModel(result.data!.id, [chatMember]);
        } else {
            throw new Error('Failed to create chat');
        }
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
}
