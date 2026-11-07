import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IPendingFlowStore } from '#electron/Application/Contracts/Services/IPendingFlowStore';
import { CancelDeviceLinkCommand } from '#shared/Devices/CancelDeviceLink';

export class CancelDeviceLinkCommandHandler implements Handler<CancelDeviceLinkCommand, void> {
    constructor(private readonly pendingFlowStore: IPendingFlowStore) { }

    public async handle(_cmd: CancelDeviceLinkCommand): Promise<Result<void>> {
        this.pendingFlowStore.clear('deviceLink');
        return Result.success();
    }
}
