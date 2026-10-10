import { ChatPrivileges } from "../../../../Domain/Enums/ChatPrivileges.js";

export class CreateChatCommand implements MediatorRequest {
    type = CreateChatCommand.name;
    chatId: string;
    friendIds: string[];
    chatMemberPrivilege: ChatPrivileges;
    groupName: string | null;

    constructor(
        id: string,
        friendIds: string[],
        chatMemberPrivilege: ChatPrivileges,
        groupName: string | null = null
    ) {
        this.chatId = id;
        this.friendIds = friendIds;
        this.chatMemberPrivilege = chatMemberPrivilege;
        this.groupName = groupName;
    }
}
