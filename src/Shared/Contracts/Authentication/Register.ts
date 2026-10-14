export class RegisterCommand implements MediatorRequest {
    public readonly type = 'RegisterCommand';
    constructor(
        public readonly username: string,
        public readonly email: string,
        public readonly password: string,
    ) { }
}

export interface RegisterResponse {
    email: string;
    id: string;
}
