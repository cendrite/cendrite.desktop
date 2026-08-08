import { Chat } from "../../../../Domain/Aggregates/Chat.js";
import { ChatMember } from "../../../../Domain/Entities/ChatMember.js";
import { ChatPrivileges } from "../../../../Domain/Enums/ChatPrivileges.js";
import { ChatMemberDto } from "../Dtos/ChatMemberDto.js";
import { MessageDto } from "../Dtos/MessageDto.js";

export class CreateChatCommand implements MediatorRequest {
    type = CreateChatCommand.name;
    chatId: string;
    friendId: string;
    chatMemberId: string;
    chatMemberPrivilege: ChatPrivileges;
    message: MessageDto | null;

    constructor(
        id: string,
        friendId: string,
        chatMemberId: string,
        chatMemberPrivilege: ChatPrivileges,
        message: MessageDto | null = null,
    ) {
        this.chatId = id;
        this.friendId = friendId;
        this.chatMemberId = chatMemberId;
        this.chatMemberPrivilege = chatMemberPrivilege;
        this.message = message;
    }
}

export class CreateChatDto{
    id: string;
    member: ChatMemberDto;

    constructor(chat: Chat, member: ChatMember) {
        this.id = chat.id;
        this.member = new ChatMemberDto(
            member.id,
            member.friend.id,
            member.privilege,
            member.displayName ?? member.friend.displayName ?? member.friend.username,
            member.friend.connectionIds.map((connectionId) => connectionId.connectionId));
    }
}
