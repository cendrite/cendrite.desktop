import { ErrorMessage } from '../../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../../Shared/Result/Result.js';
import { TokenManager } from '../../../../../Infrastructure/Services/TokenManager.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { InitializeTokenManagerCommand } from './InitializeTokenMangerCommand.js';

export class InitializeTokenManagerCommandHandler implements Handler<InitializeTokenManagerCommand> {
    constructor(private readonly tokenManager: TokenManager) { }

    public async handle(request: InitializeTokenManagerCommand): Promise<Result<void>> {
        try {
            await this.tokenManager.init(request.userId, request.deviceId);
            return Result.success();
        } catch (error) {
            console.error('Error initializing token manager:', error);
            return Result.fail(new ErrorMessage(null, 'Failed to initialize token manager.'));
        }
    }
}
