export class LoginCommand implements MediatorRequest<LoginResponse> {
    declare readonly _response?: LoginResponse;
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
