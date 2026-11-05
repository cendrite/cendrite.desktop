import { UserContract } from '../Models/UserContract.js';

export class RecoverAccountCommand implements MediatorRequest<UserContract> {
    declare readonly _response?: UserContract;
    public readonly type = 'RecoverAccountCommand';
    constructor(public readonly words: string[]) { }
}
