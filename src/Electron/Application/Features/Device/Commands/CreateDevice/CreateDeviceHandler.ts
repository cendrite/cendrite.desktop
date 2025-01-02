import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { Device } from "../../../../../Persistence/Entities/Device.js";
import { DeviceRepository } from "../../../../../Persistence/Repositories/DeviceRepository.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { CreateDeviceRequest } from "./CreateDeviceRequest.js";

export class CreateDeviceRequestHandler implements Handler<CreateDeviceRequest, void> {

    async handle(request: CreateDeviceRequest): Promise<Result<void>> {

        try {
            const _deviceRepository = new DeviceRepository();
            const device = new Device();
            device.id = request.id;
            device.privateKey = request.privateKey;
            device.publicKey = request.publicKey;

            await _deviceRepository.create(device);

            _deviceRepository.create(device);
            return Result.success();
        }
        catch {
            return Result.fail(new ErrorMessage(null, 'Failed to create device'));
        }
    }
}