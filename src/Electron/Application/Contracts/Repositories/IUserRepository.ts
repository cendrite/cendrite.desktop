import { User } from "../../../Domain/Aggregates/User.js";

export interface IUserRepository {
    create(user: User): Promise<User>;
    get(decrypt: boolean): Promise<User>;
    update(user: User): Promise<void>;
    delete(): Promise<void>;
}
