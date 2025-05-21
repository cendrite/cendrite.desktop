import {ChatPrivileges} from "../Enums/ChatPrivileges.js";
import {Friend} from "../Aggregates/Friend.js";

export class ChatMember {
    id!: string;
    privilege!: ChatPrivileges;
    displayName!: string | null;
    friend!: Friend;

    constructor(id: string, privilege: ChatPrivileges) {
        this.id = id;
        this.privilege = privilege;
    }
}