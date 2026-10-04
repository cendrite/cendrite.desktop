import { ChatPrivileges } from "../../../Domain/Enums/ChatPrivileges.js";

export class ChatMemberContract {
    id: string;
    friendId: string | null;
    userTag: string;
    privelege: ChatPrivileges;
    displayName: string;
    connectionsIds: string[] | null;

    constructor(
        id: string,
        friendId: string | null,
        userTag: string,
        privelege: number,
        displayName: string,
        connectionsIds: string[] | null = null
    ) {
        this.id = id;
        this.friendId = friendId;
        this.userTag = userTag;
        this.privelege = privelege;
        this.displayName = displayName;
        this.connectionsIds = connectionsIds;
    }
}
