export class RejectDeviceLinkCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'RejectDeviceLinkCommand';
    constructor(public readonly pendingLinkId: string) { }
}
