import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { GenerateKeysDto } from "./GenerateKeysDto.js";
import { GenerateKeysRequest } from "./GenerateKeysRequest.js";

export class GenerateKeysRequestHandler implements Handler<GenerateKeysRequest, GenerateKeysDto> {

    handle(request: GenerateKeysRequest): Result<GenerateKeysDto> {
        throw new Error("Method not implemented.");
    }

}