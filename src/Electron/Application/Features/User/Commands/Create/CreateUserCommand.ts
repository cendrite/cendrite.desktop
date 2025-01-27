export class CreateUserCommand implements MediatorRequest{
    public type = "CreateUserCommand";
    public id!: string;
    public username!: string;
    public userTag!: string;
    public profilePictureUrl?: string;
    public displayName?: string;

    constructor(id: string, username: string, userTag: string, profilePictureUrl?: string, displayName?: string) {
        this.id = id;
        this.username = username;
        this.userTag = userTag;
        this.profilePictureUrl = profilePictureUrl;
        this.displayName = displayName;
    }
}