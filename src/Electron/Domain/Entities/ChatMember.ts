import {Friend} from "../Aggregates/Friend.js";
import { ChatPrivileges } from "../Enums/ChatPrivileges.js";
import {Chat} from "../Aggregates/Chat.js";

export class ChatMember {
    id!: string;
    privilege!: ChatPrivileges;
    displayName!: string;
    userTag!: string;
    connectionIds!: string[] | null;
    friend!: Friend | null;
    chat!: Chat;

    static create(id: string, privilege: ChatPrivileges, friend: Friend): ChatMember {
        const cm = new ChatMember();
        cm.id = id;
        cm.privilege = privilege;
        cm.friend = friend;
        cm.userTag = friend.id;
        cm.connectionIds = null;
        cm.displayName = friend.displayName ?? friend.username;
        return cm;
    }

    // A group member need not be a friend, so their name and devices come from the ledger instead.
    static createExternal(
        id: string,
        privilege: ChatPrivileges,
        userTag: string,
        displayName: string,
        connectionIds: string[] = [],
    ): ChatMember {
        const cm = new ChatMember();
        cm.id = id;
        cm.privilege = privilege;
        cm.friend = null;
        cm.userTag = userTag;
        cm.connectionIds = connectionIds;
        cm.displayName = displayName;
        return cm;
    }

    public get devices(): string[] {
        return this.connectionIds ?? this.friend?.connectionIds.map((c) => c.connectionId) ?? [];
    }
}
