import { UserContract } from "../Models/UserContract.js";

export class StartupCommand implements MediatorRequest<StartupDto> {
    declare readonly _response?: StartupDto;
    public readonly type = 'StartupCommand';
}

export interface StartupDto {
    user: UserContract | null;
}
