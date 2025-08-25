export class ChatMemberDto {
    id: string;
    privilege: number;
    displayName: string;
    connectionIds!: string[];

    constructor(id: string, privilege: number, displayName: string, connectionIds: string[] | null = null) {
        this.id = id;
        this.privilege = privilege;
        this.displayName = displayName;
        this.connectionIds = connectionIds ?? [];
    }
}