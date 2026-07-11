import { Result } from '../../../../../../Shared/Result/Result.js';
import { Chat } from '../../../../../Domain/Aggregates/Chat.js';
import { Message } from '../../../../../Domain/Entities/Message.js';
import { ChatStore } from '../../../../../Infrastructure/Persistence/Repositories/ChatStore.js';
import { MediaStore } from '../../../../../Infrastructure/Persistence/Store/MediaStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { ChatDto } from '../../Dtos/ChatDto.js';
import { ChatMemberDto } from '../../Dtos/ChatMemberDto.js';
import { MediaDto } from '../../Dtos/MediaDto.js';
import { MessageDto } from '../../Dtos/MessageDto.js';
import { GetChatsQuery } from './GetChatsQuery.js';

export class GetChatsQueryHandler implements Handler<GetChatsQuery, ChatDto[]> {
    public async handle(request: GetChatsQuery): Promise<Result<ChatDto[]>> {
        const chatStore = new ChatStore();

        const chats = await chatStore.getChats(request.chatCount);

        await Promise.all(
            chats.map(async (chat) => {
                const messages = await chatStore.getMessages(chat.id, 0, request.msgCountPerChat);
                chat.messages = messages.slice().reverse();
            }),
        );

        const chatDtos = await this.mapToDto(chats);
        return Result.success<ChatDto[]>(chatDtos);
    }

    private async mapToDto(chats: Chat[]): Promise<ChatDto[]> {
        return Promise.all(
            chats.map(
                async (chat) =>
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
                        await Promise.all(chat.messages.map((m) => this.toMessageDto(m))),
                    ),
            ),
        );
    }

    private async toMessageDto(message: Message): Promise<MessageDto> {
        const mediaStore = MediaStore.getInstance();

        const mediaDtos: MediaDto[] = [];
        for (const m of message.messageMedia ?? []) {
            const mediaContent = await mediaStore.get(m.id);
            mediaDtos.push(MediaDto.fromMessageMedia(m, mediaContent));
        }

        return MessageDto.fromMessage(message, mediaDtos);
    }
}
