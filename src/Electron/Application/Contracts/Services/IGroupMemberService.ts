import { Result } from '#shared/Result/Result';
import { GroupState } from '#electron/Domain/Projections/GroupState';

export interface IGroupMemberService {
    addMember(groupId: string, friendId: string): Promise<Result>;
    reconcile(groupId: string, state: GroupState): Promise<void>;
}
