import { Result } from '#shared/Result/Result';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IDeviceProvider } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { IPendingFlowStore } from '#electron/Application/Contracts/Services/IPendingFlowStore';
import { IDeviceSessionService } from '#electron/Application/Services/Device/DeviceSessionService';
import { CheckDeviceLinkCommand, DeviceLinkProgress } from '#shared/Devices/CheckDeviceLink';
import { Device } from '#electron/Domain/Entities/Device';

export class CheckDeviceLinkCommandHandler implements Handler<CheckDeviceLinkCommand, DeviceLinkProgress> {
    constructor(
        private readonly deviceProvider: IDeviceProvider,
        private readonly pendingFlowStore: IPendingFlowStore,
        private readonly deviceSessionService: IDeviceSessionService,
    ) { }

    public async handle(_cmd: CheckDeviceLinkCommand): Promise<Result<DeviceLinkProgress>> {
        const pending = this.pendingFlowStore.get('deviceLink');
        if (!pending) return Result.success({ status: 'expired', user: null });

        const status = await this.deviceProvider.getLinkStatus(pending.pendingLinkId, pending.pollSecret);
        if (!status.success) return Result.success({ status: 'pending', user: null });

        switch (status.data.status) {
            case 'Approved': {
                const { userId, deviceId, deviceConnectionId } = status.data;
                if (!userId || !deviceId || !deviceConnectionId) return Result.success({ status: 'pending', user: null });

                const session = await this.deviceSessionService.start(
                    userId,
                    new Device(deviceId, deviceConnectionId, pending.devicePrivateKey, pending.devicePublicKey),
                    pending.signalIdentity,
                );
                if (!session.success) return session;

                this.pendingFlowStore.clear('deviceLink');
                return Result.success({ status: 'approved', user: session.data });
            }
            case 'Rejected':
                this.pendingFlowStore.clear('deviceLink');
                return Result.success({ status: 'rejected', user: null });
            case 'Expired':
                this.pendingFlowStore.clear('deviceLink');
                return Result.success({ status: 'expired', user: null });
            default:
                return Result.success({ status: 'pending', user: null });
        }
    }
}
