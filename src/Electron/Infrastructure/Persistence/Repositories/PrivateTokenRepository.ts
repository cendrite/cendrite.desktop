import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm/repository/Repository.js';
import { IPrivateTokenRepository } from '#electron/Application/Contracts/Repositories/IPrivateTokenRepository';
import { PrivateToken } from '#electron/Domain/Entities/PrivateToken';
import { getDbContext } from '../Context/DatabaseContext.js';

export class PrivateTokenRepository implements IPrivateTokenRepository {
    private readonly tokens: Repository<PrivateToken>;

    public constructor() {
        this.tokens = getDbContext().getRepository(PrivateToken);
    }

    public async store(origin: string, tokens: Buffer[]): Promise<void> {
        await this.tokens.save(tokens.map((token) => new PrivateToken(randomUUID(), origin, token)));
    }

    public count(origin: string): Promise<number> {
        return this.tokens.countBy({ origin });
    }

    public async take(origin: string): Promise<Buffer | null> {
        let candidate = await this.oldest(origin);

        while (candidate) {
            const { affected } = await this.tokens.delete({ id: candidate.id });
            if (affected === 1) return candidate.token;

            candidate = await this.oldest(origin);
        }

        return null;
    }

    public async deleteAll(): Promise<void> {
        await this.tokens.clear();
    }

    private oldest(origin: string): Promise<PrivateToken | null> {
        return this.tokens
            .createQueryBuilder('privateToken')
            .where('privateToken.origin = :origin', { origin })
            .orderBy('privateToken.createdAt', 'ASC')
            .getOne();
    }
}
