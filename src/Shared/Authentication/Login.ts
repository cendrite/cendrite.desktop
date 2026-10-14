export class LoginCommand implements MediatorRequest {
    public readonly type = 'LoginCommand';
    constructor(
        public readonly email: string,
        public readonly password: string,
    ) { }
}

export interface LoginResponse {
    userId: string;
    isVerified: boolean;
}
