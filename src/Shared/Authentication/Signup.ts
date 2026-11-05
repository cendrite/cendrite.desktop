import { UserContract } from '../Models/UserContract.js';

export interface BeginSignupResponse {
    words: string[];
    confirmIndices: number[];
}

export class BeginSignupCommand implements MediatorRequest<BeginSignupResponse> {
    declare readonly _response?: BeginSignupResponse;
    public readonly type = 'BeginSignupCommand';
}

export class CompleteSignupCommand implements MediatorRequest<UserContract> {
    declare readonly _response?: UserContract;
    public readonly type = 'CompleteSignupCommand';
    constructor(
        public readonly username: string,
        public readonly confirmations: string[],
    ) { }
}

export class CancelSignupCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'CancelSignupCommand';
}
