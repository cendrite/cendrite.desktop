export class CreateUserCommand implements MediatorRequest{
    public type = "CreateUserCommand";
    public id!: string;
    public username!: string;
    public userTag!: string;
    public base64ProfilePicture?: string;
    public displayName?: string;

    constructor(id: string, username: string, userTag: string, base64ProfilePicture?: string, displayName?: string) {
        this.id = id;
        this.username = username;
        this.userTag = userTag;
        this.base64ProfilePicture = base64ProfilePicture;
        this.displayName = displayName;
    }
}