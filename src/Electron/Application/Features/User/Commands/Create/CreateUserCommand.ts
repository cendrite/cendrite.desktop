export class CreateUserCommand implements MediatorRequest{
    public type = "CreateUserCommand";
    public id!: string;
    public username!: string;
    public userTag!: string;
    public base64ProfilePicture: string | null;
    public displayName: string | null;

    constructor(id: string, username: string, userTag: string, base64ProfilePicture: string | null, displayName: string | null) {
        this.id = id;
        this.username = username;
        this.userTag = userTag;
        this.base64ProfilePicture = base64ProfilePicture;
        this.displayName = displayName;
    }
}