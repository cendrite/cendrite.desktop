import { AwilixContainer } from 'awilix';
import { ErrorMessage } from '../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../Shared/Result/Result.js';
import { Handler } from './Handler.js';
import { Cradle } from '../../Container.js';

export class Mediator {
    constructor(private readonly container: AwilixContainer<Cradle>) { }

    private _handlers = new Map<string, Handler<MediatorRequest, any | void>>();

    public registerHandler<TRequest extends MediatorRequest, TResponse>(
        requestType: string,
        handler: Handler<TRequest, TResponse>,
    ): void {
        this._handlers.set(requestType, handler);
    }

    public async send<TRequest extends MediatorRequest, TResponse>(request: TRequest): Promise<Result<TResponse>> {
        const key = this.getRequestKey(request);

        const handler = this.container.hasRegistration(key)
            ? this.container.resolve<Handler<TRequest, TResponse>>(key)
            : (this._handlers.get(request.type) as Handler<TRequest, TResponse> | undefined);

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

    public getRequestKey(request: MediatorRequest): string {
        return request.type.charAt(0).toUpperCase() + request.type.slice(1) + 'Handler';
    }
}
