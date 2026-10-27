import { Result } from '#shared/Result/Result';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { DeviceDto, GetDevicesQuery } from '#shared/Devices/GetDevices';

export class GetDevicesQueryHandler implements Handler<GetDevicesQuery, DeviceDto[]> {
    constructor(private readonly deviceProvider: IDeviceProvider) { }

    public async handle(_query: GetDevicesQuery): Promise<Result<DeviceDto[]>> {
        const result = await this.deviceProvider.getDevices();

        if (result.success === false) return result;

        return Result.success(result.data.devices);
    }
}
