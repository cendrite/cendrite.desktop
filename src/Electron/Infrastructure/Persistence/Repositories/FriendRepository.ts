import { getDbContext } from '../Context/DatabaseContext.js';
import { Friend } from '../../../Domain/Aggregates/Friend.js';
import { IFriendRepository } from '../../../Application/Contracts/Repositories/IFriendRepository.js';

export class FriendRepository implements IFriendRepository {
    private readonly friendRepository = getDbContext().getRepository(Friend);

    public async create(friend: Friend): Promise<void> {
        await this.friendRepository.save(friend);
    }

    public async getAll(): Promise<Friend[]> {
        const friends = await this.friendRepository.find();
        return friends;
    }

    public async update(friend: Friend): Promise<void> {
        await this.friendRepository.save(friend);
    }

    public async getById(id: string): Promise<Friend | null> {
        const friend = await this.friendRepository.findOneBy({ id: id });
        return friend;
    }

    public async delete(id: string): Promise<void> {
        await this.friendRepository.delete(id);
    }

    public async deleteAll(): Promise<void> {
        await this.friendRepository.clear();
    }
}
