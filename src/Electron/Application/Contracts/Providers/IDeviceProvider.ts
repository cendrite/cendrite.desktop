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

export interface IDeviceProvider {
    getDevices(): Promise<Result<GetDevicesApiResponse>>;
    deleteDevice(deviceId: string): Promise<Result>;
    createLinkCode(): Promise<Result<LinkCodeResponse>>;
    redeemLinkCode(req: RedeemLinkCodeRequest): Promise<Result<RedeemLinkCodeResponse>>;
    getPendingLink(pendingLinkId: string): Promise<Result<PendingLinkResponse>>;
    getLinkStatus(pendingLinkId: string, pollSecret: string): Promise<Result<LinkStatusResponse>>;
    approveLink(pendingLinkId: string, approval: string): Promise<Result>;
    rejectLink(pendingLinkId: string): Promise<Result>;
}
