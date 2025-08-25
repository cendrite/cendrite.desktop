import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { DeviceRepository } from "../../../../../Persistence/Repositories/DeviceRepository.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { CreateDeviceCommand } from "./CreateDeviceCommand.js";
import {Device} from "../../../../../Domain/Entities/Device.js";

export class CreateDeviceCommandHandler implements Handler<CreateDeviceCommand> {

    async handle(request: CreateDeviceCommand): Promise<Result> {

        try {
            const _deviceRepository = new DeviceRepository();
            const device = new Device(request.id, request.connectionId, request.privateKey, request.publicKey);

            console.log('Creating Device:', device);
            console.log('Device Repository:', _deviceRepository);
            console.log(request.id, request.privateKey, request.publicKey);
            await _deviceRepository.create(device);

            return Result.success();
        }
        catch (error: unknown) {
            console.log('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Create Device Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Create Device Failed"));
        }
    }
}