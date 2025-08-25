import {ApiClient} from "../../ApiClient.ts";
import {API_URLS} from "../../ApiUrls.ts";
import {Result} from "../../../../../Shared/Result/Result.ts";

export interface CreateDeviceApiRequest {
    userId: string;
    loginNonceId: string;
    loginNonce: string;
    deviceAppVersion: string;
    deviceType: number;
    devicePlatform: number;
    base64DevicePublicKey: string;
}

export interface CreateDeviceApiResponse {
    deviceId: string;
    deviceConnectionId: string;
}

export class CreateDeviceApi{
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.USER.CREATE_DEVICE, false);
    }

    public async createDevice(request: CreateDeviceApiRequest): Promise<Result<CreateDeviceApiResponse>> {
        return this.client.handle<CreateDeviceApiResponse>({
            method: "POST",
            data: request
        });
    }
}