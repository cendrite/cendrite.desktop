import { CodeType } from '../../../Contracts/Enums/CodeType.js';

export class ResendVerificationCodeCommand implements MediatorRequest {
    public readonly type = 'ResendVerificationCodeCommand';
    constructor(
        public readonly userId: string,
        public readonly codeType: CodeType,
    ) { }
}
