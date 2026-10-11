import { ChatPrivileges } from "../../../../Domain/Enums/ChatPrivileges.js";

export class CreateChatCommand implements MediatorRequest {
    type = CreateChatCommand.name;
    chatId: string;
    friendIds: string[];
    chatMemberPrivilege: ChatPrivileges;
    groupName: string | null;
    isGroup: boolean;

    constructor(
        id: string,
        friendIds: string[],
        chatMemberPrivilege: ChatPrivileges,
        groupName: string | null = null,
        isGroup: boolean = false,
    ) {
        this.chatId = id;
        this.friendIds = friendIds;
        this.chatMemberPrivilege = chatMemberPrivilege;
        this.groupName = groupName;
        this.isGroup = isGroup;
    }
}
