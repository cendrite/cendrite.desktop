import {Friend} from "../Aggregates/Friend.js";
import { ChatPrivileges } from "../Enums/ChatPrivileges.js";

export class ChatMember {
    id!: string;
    privilege!: ChatPrivileges;
    displayName!: string;
    friend!: Friend;

    static create(id: string, privilege: ChatPrivileges, friend: Friend): ChatMember {
        const cm = new ChatMember();
        cm.id = id;
        cm.privilege = privilege;
        cm.friend = friend;
        cm.displayName = friend.displayName ?? friend.username;
        return cm;
    }
}
