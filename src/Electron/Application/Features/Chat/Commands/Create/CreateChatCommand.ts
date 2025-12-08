import { ChatPrivileges } from "../../../../../Domain/Enums/ChatPrivileges.js";

export class CreateChatCommand implements MediatorRequest {
    type = CreateChatCommand.name;
    chatId: string;
    friendId: string;
    chatMemberId: string;
    chatMemberPrivilege: ChatPrivileges;

    constructor(id: string, friendId: string, chatMemberId: string, chatMemberPrivilege: ChatPrivileges) {
        this.chatId = id;
        this.friendId = friendId;
        this.chatMemberId = chatMemberId;
        this.chatMemberPrivilege = chatMemberPrivilege;
    }
}
