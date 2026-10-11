import { Group } from '../../../Domain/Entities/Group.js';
import { GroupLifecycle } from '../../../Domain/Enums/GroupLifecycle.js';

export interface IGroupRepository {
    create(group: Group): Promise<void>;
    update(group: Group): Promise<void>;
    get(groupId: string): Promise<Group | null>;
    getByLifecycle(lifecycle: GroupLifecycle): Promise<Group[]>;
    getIds(): Promise<string[]>;
    deleteAll(): Promise<void>;
}
