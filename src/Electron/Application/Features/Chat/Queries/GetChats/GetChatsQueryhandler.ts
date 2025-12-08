import { Result } from '../../../../../../Shared/Result/Result.js';
import { Chat } from '../../../../../Domain/Aggregates/Chat.js';
import { ChatStore } from '../../../../../Persistence/Repositories/ChatStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { ChatDto } from '../../Dtos/ChatDto.js';
import { ChatMemberDto } from '../../Dtos/ChatMemberDto.js';
import { MessageDto } from '../../Dtos/MessageDto.js';
import { GetChatsQuery } from './GetChatsQuery.js';

export class GetChatsQueryHandler implements Handler<GetChatsQuery, ChatDto[]> {
    public async handle(request: GetChatsQuery): Promise<Result<ChatDto[]>> {
        const chatStore = new ChatStore();

        const chats = await chatStore.getChats(request.chatCount);

        console.log(`Loaded ${chats.length} chats from store.`);
        await Promise.all(
            chats.map(async (chat) => {
                chat.messages = await chatStore.getMessages(chat.id, request.msgCountPerChat);
            }),
        );
        const chatDtos = this.mapToDto(chats);
        return Result.success<ChatDto[]>(chatDtos);
    }

    private mapToDto(chats: Chat[]): ChatDto[] {
        return chats.map(
            (chat) =>
                new ChatDto(
                    chat.id,
                    chat.groupId,
                    chat.isGroup,
                    chat.groupName,
                    chat.members.map(
                        (member) =>
                            new ChatMemberDto(
                                member.id,
                                member.friend.id,
                                member.privilege,
                                member.displayName ?? member.friend.displayName ?? member.friend.username,
                                member.friend.connectionIds.map((conn) => conn.connectionId),
                            ),
                    ),
                    chat.messageTtl,
                    chat.muted,
                    chat.muteTimer,
                    chat.messages.map(
                        (message) =>
                            new MessageDto(
                                message.id,
                                message.messageToken,
                                message.senderId,
                                message.content,
                                message.contentUrl,
                                message.timestamp,
                                message.deliveryStatus,
                            ),
                    ),
                ),
        );
    }
}
