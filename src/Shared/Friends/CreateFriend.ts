export class CreateFriendCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    type = 'CreateFriendCommand';
    username!: string;
    displayName: string | null;
    avatarKey: string | null;
    connectionIds!: string[];
    tag!: string;

    constructor(
        username: string,
        displayName: string | null,
        connectionId: string[],
        tag: string,
        avatarKey: string | null,
    ) {
        this.tag = tag;
        this.username = username;
        this.displayName = displayName;
        this.avatarKey = avatarKey;
        this.connectionIds = connectionId;
    }
}
