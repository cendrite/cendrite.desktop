import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IEphemeralStore } from '#electron/Application/Contracts/Services/IEphemeralStore';
import { CancelDeviceLinkCommand } from '#shared/Devices/CancelDeviceLink';

export class CancelDeviceLinkCommandHandler implements Handler<CancelDeviceLinkCommand, void> {
    constructor(private readonly ephemeralStore: IEphemeralStore) { }

    public async handle(_cmd: CancelDeviceLinkCommand): Promise<Result<void>> {
        this.ephemeralStore.clear('deviceLink');
        return Result.success();
    }
}
