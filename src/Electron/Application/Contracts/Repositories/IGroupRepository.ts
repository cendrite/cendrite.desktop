import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';

export interface IGroupRepository {
    create(group: Group): Promise<void>;
    update(group: Group): Promise<void>;
    get(groupId: string): Promise<Group | null>;
    getByLifecycle(lifecycle: GroupLifecycle): Promise<Group[]>;
    getIds(): Promise<string[]>;
    delete(groupId: string): Promise<void>;
    deleteAll(): Promise<void>;
}
