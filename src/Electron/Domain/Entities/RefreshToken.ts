export class RefreshToken {
    id!: string;
    token!: string;
    expiresAt!: Date;

    constructor(token: string, expiresAt: Date) {
        this.token = token;
        this.expiresAt = expiresAt;
    }
}