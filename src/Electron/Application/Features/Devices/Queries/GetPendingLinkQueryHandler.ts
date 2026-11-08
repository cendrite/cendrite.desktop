import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { GetPendingLinkQuery, PendingLinkContract } from '#shared/Devices/GetPendingLink';
import { decoyFingerprint, fingerprintOf, shuffled } from '#electron/Infrastructure/Crypto/Fingerprint';

export class GetPendingLinkQueryHandler implements Handler<GetPendingLinkQuery, PendingLinkContract> {
    constructor(private readonly deviceProvider: IDeviceProvider) { }

    public async handle(query: GetPendingLinkQuery): Promise<Result<PendingLinkContract>> {
        const result = await this.deviceProvider.getPendingLink(query.pendingLinkId);
        if (!result.success) {
            return Result.fail<PendingLinkContract>(new ErrorMessage('NotFound', 'This request has expired or was already handled.'));
        }

        return Result.success({
            pendingLinkId: result.data.pendingLinkId,
            devicePlatform: result.data.devicePlatform,
            fingerprints: shuffled([fingerprintOf(result.data.devicePublicKey, result.data.signalIdentityKey), decoyFingerprint(), decoyFingerprint()]),
            expiresAt: result.data.expiresAt,
        });
    }
}
