export class CreateUserCommand implements MediatorRequest {
    public type = 'CreateUserCommand';
    public id: string;
    public username: string;
    public userTag: string;
    public avatarKey: string | null;
    public displayName: string | null;
    public connectionIds: string[];

    constructor(
        id: string,
        username: string,
        userTag: string,
        connectionIds: string[],
        avatarKey: string | null,
        displayName: string | null,
    ) {
        this.id = id;
        this.username = username;
        this.userTag = userTag;
        this.avatarKey = avatarKey;
        this.displayName = displayName;
        this.connectionIds = connectionIds;
    }
}
