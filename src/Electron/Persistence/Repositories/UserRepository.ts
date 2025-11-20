import { Repository } from "typeorm/repository/Repository.js";
import { CryptographyService } from "../Encryption/CryptographyService.js";
import { getDbContext } from "../Context/DatabaseContext.js";
import { User } from "../../Domain/Aggregates/User.js";

export class UserRepository {
    private repository: Repository<User>;
    private readonly cryptoService = CryptographyService.getInstance();

    public constructor() {
        this.repository = getDbContext().getRepository(User);
    }

    public async create(user: User): Promise<User> {

        const originalUser = (JSON.parse(JSON.stringify(user))); // Deep copy, to avoid returning encrypted data

        user.id = await this.cryptoService.encrypt(user.id);
        user.userTag = await this.cryptoService.encrypt(user.userTag);
        await this.repository.save(user);

        return originalUser;
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

    public async update(userUpdate: Partial<User>) {
        const result = await this.repository.find({ take: 1 });
        if (result.length === 0) {
            throw new Error("No user found");
        }
        const user = result[0];

        if(userUpdate.profilePicture) {
            user.setProfilePicture(userUpdate.profilePicture);
        }

        if(userUpdate.displayName) {
            user.setDisplayName(userUpdate.displayName);
        }

        await this.repository.save(user);
    }

    public async delete(): Promise<void> {
        await this.repository.clear();
    }
}
