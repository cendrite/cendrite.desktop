export interface StartedDeviceLink {
    fingerprint: string;
    expiresAt: string;
}

export class StartDeviceLinkCommand implements MediatorRequest<StartedDeviceLink> {
    declare readonly _response?: StartedDeviceLink;
    public readonly type = 'StartDeviceLinkCommand';
    constructor(public readonly code: string) { }
}
