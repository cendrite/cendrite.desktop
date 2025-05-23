import {ChatMemberDto} from "../Dtos/ChatMemberDto.js";
import {Chat} from "../../../../Domain/Aggregates/Chat.js";
import {ChatMember} from "../../../../Domain/Entities/ChatMember.js";

export class CreateChatDto{
    id: string;
    member: ChatMemberDto;

    constructor(chat: Chat, member: ChatMember) {
        this.id = chat.id;
        this.member = new ChatMemberDto(
            member.id,
            member.privilege,
            member.displayName ?? member.friend.displayName ?? member.friend.username,
            member.friend.connectionIds.map((connectionId) => connectionId.connectionId));
    }
}