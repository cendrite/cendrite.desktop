import { Repository } from 'typeorm/repository/Repository.js';
import { IGroupRepository } from '../../../Application/Contracts/Repositories/IGroupRepository.js';
import { GroupLifecycle } from '../../../Domain/Enums/GroupLifecycle.js';
import { getDbContext } from '../Context/DatabaseContext.js';
import { Group } from '../../../Domain/Entities/Group.js';

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

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
