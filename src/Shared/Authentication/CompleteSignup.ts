import { UserContract } from '../Models/UserContract.js';

export class CompleteSignupCommand implements MediatorRequest<UserContract> {
    declare readonly _response?: UserContract;
    public readonly type = 'CompleteSignupCommand';
    constructor(
        public readonly username: string,
        public readonly confirmations: string[],
    ) { }
}
