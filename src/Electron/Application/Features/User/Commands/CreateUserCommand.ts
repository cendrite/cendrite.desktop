export class CreateUserCommand implements MediatorRequest{
    public type = "CreateUserCommand";
    public id!: string;
    public username!: string;
    public userTag!: string;
    public profilePictureUrl?: string;
    public displayName?: string;

    constructor(username: string, userTag: string, profilePictureUrl?: string, displayName?: string) {
        this.username = username;
        this.userTag = userTag;
        this.profilePictureUrl = profilePictureUrl;
        this.displayName = displayName;
    }
}