/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorMessage } from '../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../Shared/Result/Result.js';
import { Handler } from './Handler.js';

export class Mediator {
    private _handlers = new Map<string, Handler<MediatorRequest, any | void>>();

    public registerHandler<TRequest extends MediatorRequest, TResponse>(
        requestType: string,
        handler: Handler<TRequest, TResponse>,
    ): void {
        console.log(`Registering handler for request type ${requestType}`);
        this._handlers.set(requestType, handler);
    }

    public async send<TRequest extends MediatorRequest, TResponse>(request: TRequest): Promise<Result<TResponse>> {
        const handler = this._handlers.get(request.type) as Handler<TRequest, TResponse> | undefined;

        if (!handler) {
            throw new Error(`No handler registered for request type ${request.type}`);
        }

        try {
            return await handler.handle(request);
        } catch (error) {
            console.error(`Error handling request of type ${request.type}:`, error);
            return Result.fail<TResponse>(new ErrorMessage(null, `Error handling request of type ${request.type}`));
        }
    }
}
