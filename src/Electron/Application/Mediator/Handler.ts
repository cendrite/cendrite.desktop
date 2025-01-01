import { Result } from "../../../Shared/Result/Result.js"
import { MediatorRequest } from "./MediatorRequest.js";

export interface Handler<TRequest extends MediatorRequest, TResponse> {
    handle(request: TRequest): Result<TResponse> | Promise<Result<TResponse>>;
}