import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { DeleteDeviceCommand } from '#shared/Devices/DeleteDevice';

export class DeleteDeviceCommandHandler implements Handler<DeleteDeviceCommand> {
    constructor(private readonly deviceProvider: IDeviceProvider) { }

    public async handle(cmd: DeleteDeviceCommand): Promise<Result> {
        const result = await this.deviceProvider.deleteDevice(cmd.deviceId);

        if (result.success === false) return Result.fail(new ErrorMessage(null, 'Failed to delete device'));

        return Result.success();
    }
}
