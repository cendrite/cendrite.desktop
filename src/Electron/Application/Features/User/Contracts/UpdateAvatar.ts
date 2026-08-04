export class UpdateAvatarCommand implements MediatorRequest {
    public readonly type = 'UpdateAvatarCommand';
    public readonly bytes: Uint8Array;
    public readonly mimeType: string;
    public readonly fileName: string;

    constructor(bytes: Uint8Array, mimeType: string, fileName: string) {
        this.bytes = bytes;
        this.mimeType = mimeType;
        this.fileName = fileName;
    }
}
