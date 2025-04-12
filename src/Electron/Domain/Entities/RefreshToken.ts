export class RefreshToken {
    id!: string;
    token!: string;
    expiresAt!: string;

    constructor(token: string, expiresAt: string) {
        this.token = token;
        this.expiresAt = expiresAt;
    }
}