import {DatabaseContext} from "../Context/DatabaseContext.js";
import {CryptographyService} from "../Encryption/CryptographyService.js";
import {Friend} from "../../Domain/Aggregates/Friend.js";

export class FriendRepository {
    private readonly friendRepository = DatabaseContext.getRepository(Friend);
    private readonly cryptoService = CryptographyService.getInstance();

    public async create(friend: Friend): Promise<void> {
        if (friend.connectionIds) {
            for (const conn of friend.connectionIds) {
                conn.connectionId = await this.cryptoService.encrypt(conn.connectionId);
            }
        }

        await this.friendRepository.save(friend);
    }

    public async getAll(): Promise<Friend[]> {
        const friends = await this.friendRepository.find();

        for (const friend of friends) {
            if (friend.connectionIds) {
                for (const conn of friend.connectionIds) {
                    conn.connectionId = await this.cryptoService.decrypt(conn.connectionId);
                }
            }
        }

        return friends;
    }

    public async getById(id: string): Promise<Friend | null> {
        return this.friendRepository.findOneBy({id: id});
    }

    public async delete(id: string): Promise<void> {
        await this.friendRepository.delete(id);
    }
}