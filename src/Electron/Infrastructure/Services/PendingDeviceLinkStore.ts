import { IPendingDeviceLinkStore, PendingDeviceLink } from '#electron/Application/Contracts/Services/IPendingDeviceLinkStore';

export class PendingDeviceLinkStore implements IPendingDeviceLinkStore {
    private pending: PendingDeviceLink | null = null;

    public set(pending: PendingDeviceLink): void {
        this.pending = pending;
    }

    public get(): PendingDeviceLink | null {
        return this.pending;
    }

    public clear(): void {
        this.pending = null;
    }
}
