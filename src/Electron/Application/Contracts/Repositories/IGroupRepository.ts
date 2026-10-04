import { GroupLifecycle } from '../../../Domain/Enums/GroupLifecycle.js';
import { GroupRecord } from '../../../Domain/Entities/GroupRecord.js';

export interface IGroupRepository {
    save(group: GroupRecord): Promise<void>;
    get(groupId: string): Promise<GroupRecord | null>;
    getByLifecycle(lifecycle: GroupLifecycle): Promise<GroupRecord[]>;
    deleteAll(): Promise<void>;
}
