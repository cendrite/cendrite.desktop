export class CreateRefreshTokenRequest implements MediatorRequest {
    public type = "CreateRefreshTokenRequest";
    public token!: string;
    public expiresAt!: string;

    constructor(token: string, expiresAt: string) {
        this.token = token;
        this.expiresAt = expiresAt;
    }
}