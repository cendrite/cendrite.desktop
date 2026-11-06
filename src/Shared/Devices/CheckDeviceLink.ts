import { UserContract } from '../Models/UserContract.js';

export type DeviceLinkStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface DeviceLinkProgress {
    status: DeviceLinkStatus;
    user: UserContract | null;
}

export class CheckDeviceLinkCommand implements MediatorRequest<DeviceLinkProgress> {
    declare readonly _response?: DeviceLinkProgress;
    public readonly type = 'CheckDeviceLinkCommand';
}
