import { Result } from '#shared/Result/Result';
import { ISessionManager } from '#electron/Application/Contracts/Services/ISessionManager';
import { Handler } from '#electron/Application/Mediator/Handler';
import { GetUntrustedDevicesQuery } from '#shared/Devices/GetUntrustedDevices';

export class GetUntrustedDevicesQueryHandler implements Handler<GetUntrustedDevicesQuery, string[]> {
    constructor(private readonly sessionManager: ISessionManager) { }

    public async handle(_query: GetUntrustedDevicesQuery): Promise<Result<string[]>> {
        return Result.success(await this.sessionManager.getUntrustedDevices());
    }
}
