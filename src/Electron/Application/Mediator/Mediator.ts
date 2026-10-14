import { AwilixContainer } from 'awilix';
import { ErrorMessage } from '../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../Shared/Result/Result.js';
import { Handler } from './Handler.js';
import { Cradle } from '../../Container.js';

export class Mediator {
    constructor(private readonly container: AwilixContainer<Cradle>) { }

    public async send<TResponse>(request: MediatorRequest<TResponse>): Promise<Result<TResponse>> {
        const key = this.handlerKey(request);

        if (!this.container.hasRegistration(key)) {
            throw new Error(`No handler registered for request type ${request.type}`);
        }

        const handler = this.container.resolve<Handler<MediatorRequest<TResponse>, TResponse>>(key);

        try {
            return await handler.handle(request);
        } catch (error) {
            console.error(`Error handling request of type ${request.type}:`, error);
            return Result.fail<TResponse>(new ErrorMessage(null, `Error handling request of type ${request.type}`));
        }
    }

    private handlerKey(request: MediatorRequest): string {
        return request.type.charAt(0).toLowerCase() + request.type.slice(1) + 'Handler';
    }
}
