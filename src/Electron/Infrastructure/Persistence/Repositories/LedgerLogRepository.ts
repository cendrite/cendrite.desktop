import { Repository } from 'typeorm/repository/Repository.js';
import { ILedgerLogRepository } from '#electron/Application/Contracts/Repositories/ILedgerLogRepository';
import { LedgerEventRecord } from '#electron/Domain/Entities/LedgerEventRecord';
import { LedgerEventStatus } from '#electron/Domain/Enums/LedgerEventStatus';
import { getDbContext } from '../Context/DatabaseContext.js';

export class LedgerLogRepository implements ILedgerLogRepository {
    private readonly repository: Repository<LedgerEventRecord>;

    public constructor() {
        this.repository = getDbContext().getRepository(LedgerEventRecord);
    }

    public async append(records: LedgerEventRecord[]): Promise<void> {
        if (records.length === 0) return;
        await this.repository.save(records);
    }

    public async getFrom(groupId: string, fromVersion: number): Promise<LedgerEventRecord[]> {
        return this.repository
            .createQueryBuilder('event')
            .where('event.groupId = :groupId', { groupId })
            .andWhere('event.version >= :fromVersion', { fromVersion })
            .orderBy('event.version', 'ASC')
            .getMany();
    }

    public async getAll(groupId: string): Promise<LedgerEventRecord[]> {
        return this.getFrom(groupId, 1);
    }

    public async getLastVersion(groupId: string): Promise<number> {
        const last = await this.repository.findOne({ where: { groupId }, order: { version: 'DESC' } });
        return last?.version ?? 0;
    }

    public async setStatus(
        groupId: string,
        version: number,
        status: LedgerEventStatus,
        rejectReason: string | null = null,
    ): Promise<void> {
        await this.repository.update({ groupId, version }, { status, rejectReason });
    }

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
