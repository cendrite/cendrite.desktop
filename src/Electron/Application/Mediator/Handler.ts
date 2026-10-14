import { Result } from "#shared/Result/Result"

export interface Handler<TRequest extends MediatorRequest<TResponse>, TResponse = void> {
    handle(request: TRequest): Promise<Result<TResponse>>;
}