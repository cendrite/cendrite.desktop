import { Repository } from "typeorm";
import { SessionRecord } from "../../Domain/Encryption/SessionRecord.js";
import { getDbContext } from "../Context/DatabaseContext.js";

export class SessionRecordRepository {
    private readonly repository: Repository<SessionRecord>;

    public constructor() {
        this.repository = getDbContext().getRepository(SessionRecord);
    }

    public async create(sessionRecord: SessionRecord): Promise<SessionRecord> {
        return await this.repository.save(sessionRecord);
    }

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
