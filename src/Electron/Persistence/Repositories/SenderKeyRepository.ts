import { Repository } from "typeorm";
import { SenderKey } from "../../Domain/Encryption/SenderKey.js";
import { getDbContext } from "../Context/DatabaseContext.js";

export class SenderKeyRepository {
    private readonly repository: Repository<SenderKey>;

    public constructor() {
        this.repository = getDbContext().getRepository(SenderKey);
    }

    public async create(senderKey: SenderKey): Promise<SenderKey> {
        return await this.repository.save(senderKey);
    }

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
