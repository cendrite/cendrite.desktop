import { MembershipWarning } from '../Enums/MembershipWarning.js';

export class GetMembershipWarningQuery implements MediatorRequest<MembershipWarning | null> {
    declare readonly _response?: MembershipWarning | null;
    public readonly type = 'GetMembershipWarningQuery';
    constructor(public readonly groupId: string) { }
}
