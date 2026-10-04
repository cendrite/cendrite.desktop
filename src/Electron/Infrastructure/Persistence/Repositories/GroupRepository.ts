import { Repository } from 'typeorm/repository/Repository.js';
import { IGroupRepository } from '../../../Application/Contracts/Repositories/IGroupRepository.js';
import { GroupLifecycle } from '../../../Domain/Ledger/GroupLifecycle.js';
import { GroupRecord } from '../../../Domain/Ledger/GroupRecord.js';
import { getDbContext } from '../Context/DatabaseContext.js';

export class GroupRepository implements IGroupRepository {
    private readonly repository: Repository<GroupRecord>;

    public constructor() {
        this.repository = getDbContext().getRepository(GroupRecord);
    }

    public async save(group: GroupRecord): Promise<void> {
        await this.repository.save(group);
    }

    public async get(groupId: string): Promise<GroupRecord | null> {
        return this.repository.findOneBy({ groupId });
    }

    public async getByLifecycle(lifecycle: GroupLifecycle): Promise<GroupRecord[]> {
        return this.repository.findBy({ lifecycle });
    }

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
