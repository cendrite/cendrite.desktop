export interface PendingDeviceLink {
    pendingLinkId: string;
    pollSecret: string;
    devicePublicKey: string;
    devicePrivateKey: string;
}

export interface IPendingDeviceLinkStore {
    set(pending: PendingDeviceLink): void;
    get(): PendingDeviceLink | null;
    clear(): void;
}
