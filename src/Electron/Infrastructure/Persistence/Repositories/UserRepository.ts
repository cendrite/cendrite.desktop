import { Repository } from 'typeorm/repository/Repository.js';
import { CryptographyService } from '../Encryption/CryptographyService.js';
import { getDbContext } from '../Context/DatabaseContext.js';
import { User } from '#electron/Domain/Aggregates/User';
import cloneDeep from 'lodash/cloneDeep.js';
import { IUserRepository } from '#electron/Application/Contracts/Repositories/IUserRepository';

export class UserRepository implements IUserRepository {
    private repository: Repository<User>;
    private readonly cryptoService = CryptographyService.getInstance();

    public constructor() {
        this.repository = getDbContext().getRepository(User);
    }

    public async create(user: User): Promise<User> {
        const originalUser = cloneDeep(user);

        user.id = await this.cryptoService.encrypt(user.id);
        user.userTag = await this.cryptoService.encrypt(user.userTag);
        await this.repository.save(user);

        return originalUser;
    }

    public async get(decrypt: boolean = true): Promise<User> {
        const user = await this.repository.find({ take: 1 });
        if (user.length === 0) {
            throw new Error('No user found');
        }

        if (decrypt) {
            user[0].id = await this.cryptoService.decrypt(user[0].id);
            user[0].userTag = await this.cryptoService.decrypt(user[0].userTag);
        }
        return user[0];
    }

    public async update(user: User): Promise<void> {
        await this.repository.save(user);
    }

    public async delete(): Promise<void> {
        await this.repository.clear();
    }
}
