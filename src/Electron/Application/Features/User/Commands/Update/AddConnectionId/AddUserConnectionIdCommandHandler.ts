import { ErrorMessage } from '../../../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../../../Shared/Result/Result.js';
import { UserRepository } from '../../../../../../Infrastructure/Persistence/Repositories/UserRepository.js';
import { Handler } from '../../../../../Mediator/Handler.js';
import { AddUserConnectionIdCommand } from './AddUserConnectionIdCommand.js';

export class AddUserConnectionIdCommandHandler implements Handler<AddUserConnectionIdCommand, void> {
    public async handle(request: AddUserConnectionIdCommand): Promise<Result> {
        try {
            const repository = new UserRepository();

            const user = await repository.get(false);

            user.addConnectionId(request.connectionId);

            await repository.update(user);
            
            return Result.success();

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('AddConnectionId Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, 'AddConnectionId Failed'));
        }
    }
}
