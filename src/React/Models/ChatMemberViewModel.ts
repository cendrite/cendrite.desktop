import {ChatPrivileges} from "../../Shared/Enums/ChatPrivileges.ts";
import { Contact } from "./Contact.ts";

export class ChatMemberViewModel {
    id: string;
    privilege: ChatPrivileges;
    displayName: string | null;
    userTag: string;
    connectionIds: string[];
    avatarKey: string | null;
    // A group member need not be a friend, so there may be no local contact for them.
    contact: Contact | null;

    constructor(
        id: string,
        privilege: ChatPrivileges,
        displayName: string | null,
        userTag: string,
        connectionIds: string[],
        contact: Contact | null,
        avatarKey: string | null = null,
    ) {
        this.id = id;
        this.privilege = privilege;
        this.displayName = displayName;
        this.userTag = userTag;
        this.connectionIds = connectionIds;
        this.contact = contact;
        this.avatarKey = avatarKey;
    }

    public get name(): string {
        return this.contact?.displayName ?? this.contact?.username ?? this.displayName ?? this.userTag;
    }

    public get avatar(): string | null {
        return this.contact?.avatarKey ?? this.avatarKey;
    }

    public get devices(): string[] {
        return this.contact?.connectionIds ?? this.connectionIds;
    }
}
