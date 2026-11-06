export interface PendingLinkContract {
    pendingLinkId: string;
    devicePlatform: string;
    fingerprints: string[];
    expiresAt: string;
}

export class GetPendingLinkQuery implements MediatorRequest<PendingLinkContract> {
    declare readonly _response?: PendingLinkContract;
    public readonly type = 'GetPendingLinkQuery';
    constructor(public readonly pendingLinkId: string) { }
}
