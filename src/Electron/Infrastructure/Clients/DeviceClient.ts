import { Result } from "#shared/Result/Result";
import {
    GetDevicesApiResponse,
    IDeviceProvider,
    LinkCodeResponse,
    LinkStatusResponse,
    PendingLinkResponse,
    RedeemLinkCodeRequest,
    RedeemLinkCodeResponse,
} from "#electron/Application/Contracts/Providers/IDeviceProvider";
import { ApiClient } from "./Base/ApiClient.js";

export class DeviceClient implements IDeviceProvider {
    private readonly managementClient: ApiClient;
    private readonly anonymousClient: ApiClient;

    constructor(deviceManagementApiClient: ApiClient, identityUserApiClient: ApiClient) {
        this.managementClient = deviceManagementApiClient;
        this.anonymousClient = identityUserApiClient;
    }

    getDevices(): Promise<Result<GetDevicesApiResponse>> {
        return this.managementClient.handleConduit<GetDevicesApiResponse>({
            method: "GET",
            url: "devices",
        });
    }

    deleteDevice(deviceId: string): Promise<Result> {
        return this.managementClient.handleConduit<void>({
            method: "DELETE",
            url: `device/${deviceId}`,
        }, true);
    }

    createLinkCode(): Promise<Result<LinkCodeResponse>> {
        return this.managementClient.handleConduit<LinkCodeResponse>({ method: "POST", url: "device/link/code" });
    }

    redeemLinkCode(req: RedeemLinkCodeRequest): Promise<Result<RedeemLinkCodeResponse>> {
        return this.anonymousClient.handleConduit<RedeemLinkCodeResponse>({ method: "POST", url: "device/link", data: req });
    }

    getPendingLink(pendingLinkId: string): Promise<Result<PendingLinkResponse>> {
        return this.managementClient.handleConduit<PendingLinkResponse>({ method: "GET", url: `device/link/${pendingLinkId}` });
    }

    getLinkStatus(pendingLinkId: string, pollSecret: string): Promise<Result<LinkStatusResponse>> {
        return this.anonymousClient.handleConduit<LinkStatusResponse>({
            method: "GET",
            url: `device/link/${pendingLinkId}/status`,
            headers: { "X-Poll-Secret": pollSecret },
        });
    }

    approveLink(pendingLinkId: string, approval: string): Promise<Result> {
        return this.managementClient.handleConduit<void>({ method: "POST", url: `device/link/${pendingLinkId}/approve`, data: { approval } }, true);
    }

    rejectLink(pendingLinkId: string): Promise<Result> {
        return this.managementClient.handleConduit<void>({ method: "POST", url: `device/link/${pendingLinkId}/reject` }, true);
    }
}
