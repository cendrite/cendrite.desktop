import { UserContract } from "../Models/UserContract.js";

export class StartupCommand implements MediatorRequest {
    public readonly type = 'StartupCommand';
}

export interface StartupDto {
    user: UserContract | null;
}
