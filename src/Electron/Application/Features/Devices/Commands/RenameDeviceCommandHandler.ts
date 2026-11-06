import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { RenameDeviceCommand } from '#shared/Devices/RenameDevice';

export class RenameDeviceCommandHandler implements Handler<RenameDeviceCommand> {
    constructor(private readonly deviceProvider: IDeviceProvider) { }

    public async handle(cmd: RenameDeviceCommand): Promise<Result> {
        const result = await this.deviceProvider.renameDevice(cmd.deviceId, cmd.name.trim());

        if (result.success === false) return Result.fail(new ErrorMessage(null, 'Failed to rename device'));

        return Result.success();
    }
}
