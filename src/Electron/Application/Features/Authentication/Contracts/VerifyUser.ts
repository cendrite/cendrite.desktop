export class VerifyUserCommand implements MediatorRequest {
    public readonly type = 'VerifyUserCommand';
    constructor(
        public readonly userId: string,
        public readonly verificationCode: string,
    ) { }
}
