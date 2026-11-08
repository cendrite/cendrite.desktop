import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { ApproveDeviceLinkCommand } from '#shared/Devices/ApproveDeviceLink';
import { fingerprintOf } from '#electron/Infrastructure/Crypto/Fingerprint';

export class ApproveDeviceLinkCommandHandler implements Handler<ApproveDeviceLinkCommand, void> {
    constructor(
        private readonly deviceProvider: IDeviceProvider,
        private readonly nonceSigner: INonceSigner,
    ) { }

    public async handle(cmd: ApproveDeviceLinkCommand): Promise<Result<void>> {
        const details = await this.deviceProvider.getPendingLink(cmd.pendingLinkId);
        if (!details.success) {
            return Result.fail(new ErrorMessage('NotFound', 'This request has expired or was already handled.'));
        }

        if (cmd.chosenFingerprint !== fingerprintOf(details.data.devicePublicKey, details.data.signalIdentityKey)) {
            await this.deviceProvider.rejectLink(cmd.pendingLinkId);
            return Result.fail(
                new ErrorMessage('Mismatch', "That code doesn't match the new device, so the request was cancelled. Start again on the new device."),
            );
        }

        const approval = await this.nonceSigner.signDeviceApproval(
            details.data.accountPublicKey,
            details.data.devicePublicKey,
            details.data.signalIdentityKey,
        );

        const approved = await this.deviceProvider.approveLink(cmd.pendingLinkId, approval);
        if (!approved.success) {
            return Result.fail(new ErrorMessage(null, "Couldn't approve the device. Try again."));
        }

        return Result.success();
    }
}
