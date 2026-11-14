import { Repository } from 'typeorm/repository/Repository.js';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { PendingGroupWriteKey } from '#electron/Domain/Encryption/PendingGroupWriteKey';
import { getDbContext } from '../Context/DatabaseContext.js';
import { CryptographyService } from '../Encryption/CryptographyService.js';

export class GroupKeyRepository implements IGroupKeyRepository {
    private readonly writeKeys: Repository<GroupWriteKey>;
    private readonly pendingWriteKeys: Repository<PendingGroupWriteKey>;
    private readonly epochKeys: Repository<GroupEpochKey>;
    private readonly cryptoService = CryptographyService.getInstance();

    public constructor() {
        this.writeKeys = getDbContext().getRepository(GroupWriteKey);
        this.pendingWriteKeys = getDbContext().getRepository(PendingGroupWriteKey);
        this.epochKeys = getDbContext().getRepository(GroupEpochKey);
    }

    public async saveWriteKey(writeKey: GroupWriteKey): Promise<void> {
        await this.writeKeys.save(
            new GroupWriteKey(writeKey.groupId, writeKey.publicKey, await this.seal(writeKey.privateKey)),
        );
    }

    public async getWriteKey(groupId: string): Promise<GroupWriteKey | null> {
        const stored = await this.writeKeys.findOneBy({ groupId });
        if (!stored) return null;

        return new GroupWriteKey(stored.groupId, stored.publicKey, await this.unseal(stored.privateKey));
    }

    public async savePendingWriteKey(writeKey: PendingGroupWriteKey): Promise<void> {
        await this.pendingWriteKeys.save(
            new PendingGroupWriteKey(writeKey.groupId, writeKey.publicKey, await this.seal(writeKey.privateKey)),
        );
    }

    public async getPendingWriteKey(groupId: string): Promise<PendingGroupWriteKey | null> {
        const stored = await this.pendingWriteKeys.findOneBy({ groupId });
        if (!stored) return null;

        return new PendingGroupWriteKey(stored.groupId, stored.publicKey, await this.unseal(stored.privateKey));
    }

    public async deletePendingWriteKey(groupId: string): Promise<void> {
        await this.pendingWriteKeys.delete({ groupId });
    }

    public async saveEpochKey(epochKey: GroupEpochKey): Promise<void> {
        await this.epochKeys.save(
            new GroupEpochKey(epochKey.groupId, epochKey.epoch, await this.seal(epochKey.key)),
        );
    }

    public async getEpochKey(groupId: string, epoch: number): Promise<GroupEpochKey | null> {
        const stored = await this.epochKeys.findOneBy({ groupId, epoch });
        if (!stored) return null;

        return new GroupEpochKey(stored.groupId, stored.epoch, await this.unseal(stored.key));
    }

    public async getEpochKeys(groupId: string): Promise<GroupEpochKey[]> {
        const stored = await this.epochKeys.findBy({ groupId });

        return Promise.all(
            stored.map(async (key) => new GroupEpochKey(key.groupId, key.epoch, await this.unseal(key.key))),
        );
    }

    public async deleteAll(): Promise<void> {
        await this.writeKeys.clear();
        await this.pendingWriteKeys.clear();
        await this.epochKeys.clear();
    }

    // CryptographyService works in strings, so raw key bytes travel through base64 on the way in and out.
    private async seal(key: Buffer): Promise<Buffer> {
        return Buffer.from(await this.cryptoService.encrypt(key.toString('base64')), 'utf8');
    }

    private async unseal(sealed: Buffer): Promise<Buffer> {
        return Buffer.from(await this.cryptoService.decrypt(sealed.toString('utf8')), 'base64');
    }
}
