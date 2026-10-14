export class VerifyUserCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'VerifyUserCommand';
    constructor(
        public readonly userId: string,
        public readonly verificationCode: string,
    ) { }
}
