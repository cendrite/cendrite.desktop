export const DEVICE_NAME_MAX_LENGTH = 32;

export class RenameDeviceCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'RenameDeviceCommand';

    constructor(
        public readonly deviceId: string,
        public readonly name: string,
    ) { }
}
