import { Repository } from "typeorm/repository/Repository.js";
import { CryptographyService } from "../Encryption/CryptographyService.js";
import { User } from "../Entities/User.js";
import { DatabaseContext } from "../Context/DatabaseContext.js";

export class UserRepository {
    private repository: Repository<User>;
    private readonly cryptoService = CryptographyService.getInstance();

    public constructor() {
        this.repository = DatabaseContext.getRepository(User);
    }

    public async create(user: User): Promise<User> {
        throw new Error("Method not implemented.");
    }

    public async get(): Promise<User> {
        throw new Error("Method not implemented.");
    }

    public async update(user: User): Promise<User> {
        throw new Error("Method not implemented.");
    }

    public async delete(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}