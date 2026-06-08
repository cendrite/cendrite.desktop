export class UpdateAvatarCommand implements MediatorRequest {
    public readonly type = "UpdateAvatarCommand";
    public readonly avatarKey: string;

    constructor(avatarKey: string){
        this.avatarKey = avatarKey;
    }
}
