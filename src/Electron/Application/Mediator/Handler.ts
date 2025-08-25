import { Result } from "../../../Shared/Result/Result.js"

export interface Handler<TRequest extends MediatorRequest, TResponse = void> {
    handle(request: TRequest): Promise<Result<TResponse>>;
}