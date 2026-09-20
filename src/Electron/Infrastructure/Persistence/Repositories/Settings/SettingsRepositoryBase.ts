import { Repository } from 'typeorm/repository/Repository.js';
import { getDbContext } from '../../Context/DatabaseContext.js';
import { SettingsRecord } from '../../../../Domain/Entities/Settings/SettingsRecord.js';
import { ISettingsRepository } from '../../../../Application/Contracts/Repositories/ISettingsRepository.js';

export abstract class SettingsRepositoryBase<T extends SettingsRecord> implements ISettingsRepository {
    private readonly repository: Repository<T>;
    private readonly target: new () => T;

    protected constructor(target: new () => T) {
        this.target = target;
        this.repository = getDbContext().getRepository<T>(target);
    }

    public async get(): Promise<string | null> {
        const rows = await this.repository.find({ take: 1 });
        return rows.length === 0 ? null : rows[0].value;
    }

    public async set(value: string): Promise<void> {
        await this.repository.clear();

        const record = new this.target();
        record.value = value;

        await this.repository.save(record);
    }

    public async delete(): Promise<void> {
        await this.repository.clear();
    }
}
