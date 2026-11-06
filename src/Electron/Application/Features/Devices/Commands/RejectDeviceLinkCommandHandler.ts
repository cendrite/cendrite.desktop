import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { RejectDeviceLinkCommand } from '#shared/Devices/RejectDeviceLink';

export class RejectDeviceLinkCommandHandler implements Handler<RejectDeviceLinkCommand, void> {
    constructor(private readonly deviceProvider: IDeviceProvider) { }

    public async handle(cmd: RejectDeviceLinkCommand): Promise<Result<void>> {
        await this.deviceProvider.rejectLink(cmd.pendingLinkId);
        return Result.success();
    }
}
