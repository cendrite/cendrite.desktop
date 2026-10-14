import { UserContract } from '../Models/UserContract.js';
export class VerifyLoginCommand implements MediatorRequest<UserContract> {
    declare readonly _response?: UserContract;
    public readonly type = 'VerifyLoginCommand';
    constructor(
        public readonly userId: string,
        public readonly loginVerificationCode: string,
    ) { }
}
