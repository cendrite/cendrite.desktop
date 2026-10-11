import { Result } from "../../../../../Shared/Result/Result.js";
import { Chat } from "../../../../Domain/Aggregates/Chat.js";
import { Message } from "../../../../Domain/Entities/Message.js";
import { ChatContract } from "../../../Contracts/Models/ChatContract.js";
import { ChatMemberContract } from "../../../Contracts/Models/ChatMemberContract.js";
import { MediaContract } from "../../../Contracts/Models/MediaContract.js";
import { MessageContract } from "../../../Contracts/Models/MessageContract.js";
import { IChatStore } from "../../../Contracts/Repositories/IChatStore.js";
import { IGroupRepository } from "../../../Contracts/Repositories/IGroupRepository.js";
import { IMediaStore } from "../../../Contracts/Repositories/IMediaStore.js";
import { Handler } from "../../../Mediator/Handler.js";
import { GetChatsQuery } from "../Contracts/GetChats.js";

export class GetChatsQueryHandler implements Handler<GetChatsQuery, ChatContract[]> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly mediaStore: IMediaStore,
        private readonly groupRepository: IGroupRepository,
    ) { }
    public async handle(request: GetChatsQuery): Promise<Result<ChatContract[]>> {

        const chats = await this.chatStore.getChats(request.chatCount);

        await Promise.all(
            chats.map(async (chat) => {
                const messages = await this.chatStore.getMessages(chat.id, 0, request.msgCountPerChat);
                chat.messages = messages.slice().reverse();
            }),
        );

        const groupIds = new Set(await this.groupRepository.getIds());

        const chatDtos = await this.mapToDto(chats, groupIds);
        return Result.success<ChatContract[]>(chatDtos);
    }

    private async mapToDto(chats: Chat[], groupIds: Set<string>): Promise<ChatContract[]> {
        return Promise.all(
            chats.map(
                async (chat) =>
                    new ChatContract(
                        chat.id,
                        groupIds.has(chat.id),
                        chat.groupName,
                        chat.members.map(
                            (member) =>
                                new ChatMemberContract(
                                    member.id,
                                    member.friend?.id ?? null,
                                    member.userTag,
                                    member.privilege,
                                    member.displayName ?? member.friend?.displayName ?? member.userTag,
                                    member.devices,
                                ),
                        ),
                        chat.messageTtl,
                        chat.muted,
                        chat.muteTimer,
                        await Promise.all(chat.messages.map((m) => this.toMessageContracts(m))),
                    ),
            ),
        );
    }

    private async toMessageContracts(message: Message): Promise<MessageContract> {

        const mediaDtos: MediaContract[] = [];
        for (const m of message.messageMedia ?? []) {
            const mediaContent = await this.mediaStore.get(m.id);
            mediaDtos.push(new MediaContract(m.id, m.type, mediaContent));
        }

        return new MessageContract(
            message.id,
            message.chatId,
            message.senderId,
            message.content,
            message.timestamp,
            mediaDtos,
            message.deliveryStatus,
            message.messageToken
        );
    }
}
