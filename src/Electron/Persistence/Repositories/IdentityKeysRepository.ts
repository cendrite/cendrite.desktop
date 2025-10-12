import { Repository } from "typeorm";
import { IdentityKeys } from "../../Domain/Encryption/IdentityKeys.js";
import { getDbContext } from "../Context/DatabaseContext.js";

export class IdentityKeysRepository {
    private repository: Repository<IdentityKeys>;

    public constructor() {
        this.repository = getDbContext().getRepository(IdentityKeys);
    }

    public async create(identityKeys: IdentityKeys): Promise<IdentityKeys> {
        return this.repository.save(identityKeys);
    }
}
