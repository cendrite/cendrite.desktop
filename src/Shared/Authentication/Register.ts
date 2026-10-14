export class RegisterCommand implements MediatorRequest<RegisterResponse> {
    declare readonly _response?: RegisterResponse;
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
