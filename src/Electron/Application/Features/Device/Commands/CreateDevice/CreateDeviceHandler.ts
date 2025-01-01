import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { CreateDeviceRequest } from "./CreateDeviceRequest.js";

export class CreateDeviceRequestHandler implements Handler<CreateDeviceRequest, void> {
    handle(request: CreateDeviceRequest): Promise<Result<void>> {
        throw new Error("Method not implemented.");
    }
}