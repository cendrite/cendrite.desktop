import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IPendingDeviceLinkStore } from '#electron/Application/Contracts/Services/IPendingDeviceLinkStore';
import { CancelDeviceLinkCommand } from '#shared/Devices/CancelDeviceLink';

export class CancelDeviceLinkCommandHandler implements Handler<CancelDeviceLinkCommand, void> {
    constructor(private readonly pendingDeviceLinkStore: IPendingDeviceLinkStore) { }

    public async handle(_cmd: CancelDeviceLinkCommand): Promise<Result<void>> {
        this.pendingDeviceLinkStore.clear();
        return Result.success();
    }
}
