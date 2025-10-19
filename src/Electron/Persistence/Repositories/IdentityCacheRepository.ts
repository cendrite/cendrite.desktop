import { Repository } from "typeorm/repository/Repository.js";
import { IdentityCache } from "../../Domain/Encryption/IdentityCache.js";
import { getDbContext } from "../Context/DatabaseContext.js";

export class IdentityCacheRepository {
    private readonly repository: Repository<IdentityCache>;

    public constructor() {
        this.repository = getDbContext().getRepository(IdentityCache);
    }

    public async create(identityCache: IdentityCache): Promise<IdentityCache> {
        return await this.repository.save(identityCache);
    }

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
