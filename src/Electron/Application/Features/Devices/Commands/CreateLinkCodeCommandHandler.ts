import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { CreateLinkCodeCommand, LinkCodeContract } from '#shared/Devices/CreateLinkCode';

export class CreateLinkCodeCommandHandler implements Handler<CreateLinkCodeCommand, LinkCodeContract> {
    constructor(private readonly deviceProvider: IDeviceProvider) { }

    public async handle(_cmd: CreateLinkCodeCommand): Promise<Result<LinkCodeContract>> {
        const result = await this.deviceProvider.createLinkCode();
        if (!result.success) {
            const tooMany = result.errorMessage.code === 'Too Many Requests';
            return Result.fail<LinkCodeContract>(
                new ErrorMessage(null, tooMany ? 'Too many link codes. Try again in a while.' : "Couldn't create a link code. Try again."),
            );
        }

        return Result.success({ code: result.data.code, expiresAt: result.data.expiresAt });
    }
}
