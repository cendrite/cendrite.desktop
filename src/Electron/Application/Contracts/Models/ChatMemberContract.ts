import { ChatPrivileges } from "../../../Domain/Enums/ChatPrivileges.js";

export class ChatMemberContract {
    id: string;
    friendId: string;
    privelege: ChatPrivileges;
    displayName: string;
    connectionsIds: string[] | null;
    
    constructor(
        id: string,
        friendId: string,
        privelege: number,
        displayName: string,
        connectionsIds: string[] | null = null
    ) {
        this.id = id;
        this.friendId = friendId;
        this.privelege = privelege;
        this.displayName = displayName;
        this.connectionsIds = connectionsIds;
    }
}
