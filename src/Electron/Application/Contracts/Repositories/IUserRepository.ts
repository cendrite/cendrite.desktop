import { User } from "#electron/Domain/Aggregates/User";

export interface IUserRepository {
    create(user: User): Promise<User>;
    get(decrypt: boolean): Promise<User>;
    update(user: User): Promise<void>;
    delete(): Promise<void>;
}
