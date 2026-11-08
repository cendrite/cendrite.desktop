import { Result } from "#shared/Result/Result";
import { DeviceDto } from "#shared/Devices/GetDevices";

export interface GetDevicesApiResponse {
    devices: DeviceDto[];
}

export interface LinkCodeResponse {
    code: string;
    expiresAt: string;
}

export interface RedeemLinkCodeRequest {
    code: string;
    devicePublicKey: string;
    signalIdentityKey: string;
    deviceAppVersion: string;
    deviceType: number;
    devicePlatform: number;
}

export interface RedeemLinkCodeResponse {
    pendingLinkId: string;
    pollSecret: string;
    expiresAt: string;
}

export interface PendingLinkResponse {
    pendingLinkId: string;
    devicePublicKey: string;
    signalIdentityKey: string;
    devicePlatform: string;
    accountPublicKey: string;
    expiresAt: string;
}

export interface LinkStatusResponse {
    status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
    userId: string | null;
    deviceId: string | null;
    deviceConnectionId: string | null;
}

export interface ChainDevice {
    id: string;
    connectionId: string;
    publicKey: string;
    signalIdentityKey: string;
    approvedBy: string | null;
    approvalSignature: string | null;
    removed: boolean;
}

export interface ChainRotation {
    deviceId: string;
    oldAccountPublicKey: string;
    newAccountPublicKey: string;
    proof: string;
    approval: string;
}

export interface DeviceChain {
    userTag: string;
    accountPublicKey: string;
    devices: ChainDevice[];
    rotations: ChainRotation[];
}

export interface IDeviceProvider {
    getDevices(): Promise<Result<GetDevicesApiResponse>>;
    getDeviceChain(connectionId: string): Promise<Result<DeviceChain>>;
    deleteDevice(deviceId: string): Promise<Result>;
    renameDevice(deviceId: string, name: string): Promise<Result>;
    createLinkCode(): Promise<Result<LinkCodeResponse>>;
    redeemLinkCode(req: RedeemLinkCodeRequest): Promise<Result<RedeemLinkCodeResponse>>;
    getPendingLink(pendingLinkId: string): Promise<Result<PendingLinkResponse>>;
    getLinkStatus(pendingLinkId: string, pollSecret: string): Promise<Result<LinkStatusResponse>>;
    approveLink(pendingLinkId: string, approval: string): Promise<Result>;
    rejectLink(pendingLinkId: string): Promise<Result>;
}
