import { User } from "../../../Contracts/Models/User.js";

export class StartupCommand implements MediatorRequest {
    public readonly type = 'StartupCommand';
}

export interface StartupDto {
    user: User | null;
}
