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
        user.id = await this.cryptoService.encrypt(user.id);
        user.userTag = await this.cryptoService.encrypt(user.userTag);
        return await this.repository.save(user);
    }

    public async get(): Promise<User> {
        const user = await this.repository.find({ take: 1 });
        if (user.length === 0) {
            throw new Error("No user found");
        }

        user[0].id = await this.cryptoService.decrypt(user[0].id);
        user[0].userTag = await this.cryptoService.decrypt(user[0].userTag);

        return user[0];
    }

    public async update(user: User): Promise<User> {
        throw new Error("Method not implemented.");
    }

    public async delete(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}