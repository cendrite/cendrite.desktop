import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { MembershipWarning } from '#shared/Enums/MembershipWarning';

export interface IGroupRepository {
    create(group: Group): Promise<void>;
    update(group: Group): Promise<void>;
    setMembershipWarning(groupId: string, warning: MembershipWarning | null): Promise<void>;
    get(groupId: string): Promise<Group | null>;
    getByLifecycle(lifecycle: GroupLifecycle): Promise<Group[]>;
    getIds(): Promise<string[]>;
    deleteAll(): Promise<void>;
}
