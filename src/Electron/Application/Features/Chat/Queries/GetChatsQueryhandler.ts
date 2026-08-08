import { Result } from "../../../../../Shared/Result/Result.js";
import { Chat } from "../../../../Domain/Aggregates/Chat.js";
import { Message } from "../../../../Domain/Entities/Message.js";
import { IChatStore } from "../../../Contracts/Repositories/IChatStore.js";
import { IMediaStore } from "../../../Contracts/Repositories/IMediaStore.js";
import { Handler } from "../../../Mediator/Handler.js";
import { GetChatsQuery } from "../Contracts/GetChats.js";
import { ChatDto } from "../Dtos/ChatDto.js";
import { ChatMemberDto } from "../Dtos/ChatMemberDto.js";
import { MediaDto } from "../Dtos/MediaDto.js";
import { MessageDto } from "../Dtos/MessageDto.js";

export class GetChatsQueryHandler implements Handler<GetChatsQuery, ChatDto[]> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
    ) { }
    public async handle(request: GetChatsQuery): Promise<Result<ChatDto[]>> {

        const chats = await this.chatStore.getChats(request.chatCount);

        await Promise.all(
            chats.map(async (chat) => {
                const messages = await this.chatStore.getMessages(chat.id, 0, request.msgCountPerChat);
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

        const mediaDtos: MediaDto[] = [];
        for (const m of message.messageMedia ?? []) {
            const mediaContent = await this.mediaStore.get(m.id);
            mediaDtos.push(MediaDto.fromMessageMedia(m, mediaContent));
        }

        return MessageDto.fromMessage(message, mediaDtos);
    }
}
