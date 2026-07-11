export class VerifyLoginCommand implements MediatorRequest {
    public readonly type = 'VerifyLoginCommand';
    constructor(
        public readonly userId: string,
        public readonly loginVerificationCode: string,
    ) { }
}

export interface VerifyLoginResponse {
    deviceId: string;
    connectionId: string;
}
