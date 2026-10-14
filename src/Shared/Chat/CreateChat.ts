import { ChatContract } from '../Models/ChatContract.js';
import { ChatPrivileges } from "../Enums/ChatPrivileges.js";

export class CreateChatCommand implements MediatorRequest<ChatContract> {
    declare readonly _response?: ChatContract;
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
