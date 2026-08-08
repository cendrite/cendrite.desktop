import { Result } from "../../../../../Shared/Result/Result.js";
import { Chat } from "../../../../Domain/Aggregates/Chat.js";
import { ChatMember } from "../../../../Domain/Entities/ChatMember.js";
import { Message } from "../../../../Domain/Entities/Message.js";
import { ChatContract } from "../../../Contracts/Models/ChatContract.js";
import { ChatMemberContract } from "../../../Contracts/Models/ChatMemberContract.js";
import { IChatStore } from "../../../Contracts/Repositories/IChatStore.js";
import { IFriendRepository } from "../../../Contracts/Repositories/IFriendRepository.js";
import { Handler } from "../../../Mediator/Handler.js";
import { CreateChatCommand, CreateChatDto } from "../Contracts/CreateChat.js";

export class CreateChatCommandHandler implements Handler<CreateChatCommand, ChatContract> {
    constructor(
        private readonly friendRepository: IFriendRepository,
        private readonly chatStore: IChatStore,
    ) { }

    public async handle(cmd: CreateChatCommand): Promise<Result<CreateChatDto>> {
        const friend = await this.friendRepository.getById(cmd.friendId);
        if (!friend) {
            throw new Error('Friend not found');
        }

        const chatMember = ChatMember.create(cmd.chatMemberId, cmd.chatMemberPrivilege, friend);

        const msg = cmd.message
            ? new Message(
                cmd.message.id,
                cmd.chatId,
                cmd.message.senderId,
                cmd.message.timestamp,
                cmd.message.content,
                [],
                cmd.message.deliveryStatus,
            )
            : null;

        console.log('Creating new chat with:', cmd);
        const newChat = new Chat(
            cmd.chatId,
            [chatMember],
            [msg].filter((m): m is Message => m !== null),
        );

        const chat = await this.chatStore.create(newChat);

        const chatMemberDto = new CreateChatDto(chat, chatMember);

        return Result.success<CreateChatDto>(chatMemberDto);
    }

    private mapToContract(chat: Chat): ChatContract {
        return new ChatContract(
            chat.id,
            chat.groupId,
            chat.isGroup,
            chat.groupName,
            chat.members.map(
                (member) =>
                    new ChatMemberContract(
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
            chat.messages.map((m) => this.toMessageContracts(m)),
        );
    }
}
