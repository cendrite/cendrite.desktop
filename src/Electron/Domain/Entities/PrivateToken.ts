export class PrivateToken {
    id: string;
    origin: string;
    token: Buffer;

    constructor(id: string, origin: string, token: Buffer) {
        this.id = id;
        this.origin = origin;
        this.token = token;
    }
}
