export class ApproveDeviceLinkCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'ApproveDeviceLinkCommand';
    constructor(
        public readonly pendingLinkId: string,
        public readonly chosenFingerprint: string,
    ) { }
}
