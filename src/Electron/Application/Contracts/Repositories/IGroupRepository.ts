import { GroupLifecycle } from '../../../Domain/Ledger/GroupLifecycle.js';
import { GroupRecord } from '../../../Domain/Ledger/GroupRecord.js';

export interface IGroupRepository {
    save(group: GroupRecord): Promise<void>;
    get(groupId: string): Promise<GroupRecord | null>;
    getByLifecycle(lifecycle: GroupLifecycle): Promise<GroupRecord[]>;
    deleteAll(): Promise<void>;
}
