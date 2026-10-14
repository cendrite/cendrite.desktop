import { Friend } from '#electron/Domain/Aggregates/Friend';

export interface IFriendRepository {
    create(friend: Friend): Promise<void>;
    getAll(): Promise<Friend[]>;
    update(friend: Friend): Promise<void>;
    getById(id: string): Promise<Friend | null>;
    getByIds(ids: string[]): Promise<Friend[]>;
    delete(id: string): Promise<void>;
    deleteAll(): Promise<void>;
}
