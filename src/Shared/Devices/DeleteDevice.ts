export class DeleteDeviceCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'DeleteDeviceCommand';

    constructor(public readonly deviceId: string) { }
}
