export class ChatMemberDto {
    id: string;
    friendId: string;
    privilege: number;
    displayName: string;
    connectionIds!: string[];

    constructor(
        id: string,
        friendId: string,
        privilege: number,
        displayName: string,
        connectionIds: string[] | null = null,
    ) {
        this.id = id;
        this.friendId = friendId;
        this.privilege = privilege;
        this.displayName = displayName;
        this.connectionIds = connectionIds ?? [];
    }
}
