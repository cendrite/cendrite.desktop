import { Repository } from "typeorm";
import { getDbContext } from "../Context/DatabaseContext.js";
import { SignedPreKey } from "../../Domain/Encryption/SignedPreKey.js";

export class SignedPreKeysRepository {
    private repository: Repository<SignedPreKey>;
    public constructor() {
        this.repository = getDbContext().getRepository(SignedPreKey);
    }
   public async create(signedPreKey: SignedPreKey): Promise<SignedPreKey> {
        return this.repository.save(signedPreKey);
    }
}
