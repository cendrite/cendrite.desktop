import { Result } from "../../../Shared/Result/Result";
import { CreateDeviceApi } from "../Api/Identity/User/CreateDeviceApi";
import {
    GenerateKeysRequest
} from "../../../Electron/Application/Features/Device/Commands/GenerateKeys/GenerateKeysRequest.ts";
import {GenerateKeysDto} from "../../../Electron/Application/Features/Device/Commands/GenerateKeys/GenerateKeysDto.ts";
import {ErrorMessage} from "../../../Shared/Result/ErrorMessage.ts";
import {
    CreateDeviceRequest
} from "../../../Electron/Application/Features/Device/Commands/CreateDevice/CreateDeviceRequest.ts";


export class DeviceService {
    private readonly CreateDeviceApi = new CreateDeviceApi();

    public async HandleDeviceRegistration(userId: string, loginNonceId: string, loginNonce: string): Promise<Result<string>>
    {
        const keys = await window.electron.sendRequestAsync<Result<GenerateKeysDto>>(new GenerateKeysRequest());
        if(!keys.success){
            console.error(keys.errorMessage);
            //TODO: this would be a fatal error
            return Result.fail<string>(new ErrorMessage("","Failed to generate keys"));
        }

        const remoteDeviceResult = await this.CreateDeviceApi.createDevice({
            userId: userId,
            loginNonceId: loginNonceId,
            loginNonce: loginNonce,
            deviceAppVersion: "1.0",
            deviceType: 1,
            devicePlatform: 1,
            base64DevicePublicKey: keys.data!.publicKey,
        });

        if (!remoteDeviceResult.success) {
            //TODO: this would be a fatal error
            console.error(remoteDeviceResult.errorMessage);
            return Result.fail<string>(new ErrorMessage("","Failed to create device"));
        }

        const localDeviceResult = await window.electron.sendRequestAsync<Result>(new CreateDeviceRequest(
            remoteDeviceResult.data!.deviceId, keys.data!.publicKey, keys.data!.privateKey
        ))

        if(!localDeviceResult.success) {
            console.error(localDeviceResult.errorMessage);
            //TODO: this would be a fatal error
            return Result.fail<string>(new ErrorMessage("", "Failed to create local device"));
        }

        return Result.success(remoteDeviceResult.data!.deviceId);
    }
}