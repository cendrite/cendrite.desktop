import { Repository } from 'typeorm/repository/Repository.js';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { getDbContext } from '../Context/DatabaseContext.js';
import { Group } from '#electron/Domain/Entities/Group';

export class GroupRepository implements IGroupRepository {
    private readonly repository: Repository<Group>;

    public constructor() {
        this.repository = getDbContext().getRepository(Group);
    }

    public async update(group: Group): Promise<void> {
        await this.repository.save(group);
    }

    public async create(group: Group): Promise<void> {
        await this.repository.save(group);
    }

    public async get(groupId: string): Promise<Group | null> {
        return this.repository.findOneBy({ groupId });
    }

    public async getByLifecycle(lifecycle: GroupLifecycle): Promise<Group[]> {
        return this.repository.findBy({ lifecycle });
    }

    public async getIds(): Promise<string[]> {
        const groups = await this.repository.find({ select: { groupId: true } });
        return groups.map((group) => group.groupId);
    }

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
