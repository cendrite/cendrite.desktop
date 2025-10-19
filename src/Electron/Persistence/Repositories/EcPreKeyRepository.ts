import { Repository } from "typeorm";
import { EcPreKey } from "../../Domain/Encryption/EcPreKey.js";
import { getDbContext } from "../Context/DatabaseContext.js";

export class EcPreKeyRepository {
    private readonly repository: Repository<EcPreKey>;

    public constructor() {
        this.repository = getDbContext().getRepository(EcPreKey);
    }

    public async create(ecPreKey: EcPreKey): Promise<EcPreKey> {
        return await this.repository.save(ecPreKey);
    }

    public async getById(id: number): Promise<EcPreKey | null> {
        return await this.repository.findOne({ where: { id } });
    }

    public async deleteAll(): Promise<void> {
        await this.repository.clear();
    }
}
