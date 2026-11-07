import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { INonceSigner } from '#electron/Application/Contracts/Services/INonceSigner';
import { IPendingFlowStore } from '#electron/Application/Contracts/Services/IPendingFlowStore';
import { currentDeviceInfo } from '#electron/Application/Services/Device/DeviceInfo';
import { StartDeviceLinkCommand, StartedDeviceLink } from '#shared/Devices/StartDeviceLink';
import { fingerprintOf } from '#electron/Infrastructure/Crypto/Fingerprint';

export class StartDeviceLinkCommandHandler implements Handler<StartDeviceLinkCommand, StartedDeviceLink> {
    constructor(
        private readonly deviceProvider: IDeviceProvider,
        private readonly nonceSigner: INonceSigner,
        private readonly pendingFlowStore: IPendingFlowStore,
    ) { }

    public async handle(cmd: StartDeviceLinkCommand): Promise<Result<StartedDeviceLink>> {
        this.pendingFlowStore.clear('deviceLink');

        const keys = this.nonceSigner.generateDeviceKeys();
        const device = currentDeviceInfo();

        const result = await this.deviceProvider.redeemLinkCode({
            code: cmd.code,
            devicePublicKey: keys.publicKey,
            deviceAppVersion: device.appVersion,
            deviceType: device.type,
            devicePlatform: device.platform,
        });

        if (!result.success) {
            return Result.fail<StartedDeviceLink>(new ErrorMessage('InvalidCode', "That code didn't work. Check it, or create a new one on your other device."));
        }

        this.pendingFlowStore.set('deviceLink', {
            pendingLinkId: result.data.pendingLinkId,
            pollSecret: result.data.pollSecret,
            devicePublicKey: keys.publicKey,
            devicePrivateKey: keys.privateKey,
        });

        return Result.success({ fingerprint: fingerprintOf(keys.publicKey), expiresAt: result.data.expiresAt });
    }
}
