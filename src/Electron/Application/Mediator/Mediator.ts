/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result } from "../../../Shared/Result/Result.js";
import { Handler } from "./Handler.js";
import { MediatorRequest } from "./MediatorRequest.js";

export class Mediator {
    private _handlers = new Map<string, Handler<any, any>>();

    public registerHandler<TRequest extends MediatorRequest, TResponse>(
        requestType: string,
        handler: Handler<TRequest, TResponse>
    ): void {
        this._handlers.set(requestType, handler);
    }

    public async send<TRequest extends MediatorRequest, TResponse>(
        request: TRequest
    ): Promise<Result<TResponse>> {
        const handler = this._handlers.get(request.type) as Handler<TRequest, TResponse> | undefined;

        if (!handler) {
            throw new Error(`No handler registered for request type ${request.type}`);
        }

        return await handler.handle(request);
    }
}
