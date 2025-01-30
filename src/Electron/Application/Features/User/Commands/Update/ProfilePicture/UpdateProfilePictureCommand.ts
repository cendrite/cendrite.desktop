export class UpdateProfilePictureCommand implements MediatorRequest {
    public readonly type = "UpdateProfilePictureCommand";
    public readonly base64ProfilePicture: string;

    constructor(base64ProfilePicture: string){
        this.base64ProfilePicture = base64ProfilePicture;
    }
}