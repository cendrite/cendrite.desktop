import { ErrorMessage } from '../../../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../../../Shared/Result/Result.js';
import { UserRepository } from '../../../../../../Persistence/Repositories/UserRepository.js';
import { Handler } from '../../../../../Mediator/Handler.js';
import { RemoveUserConnectionIdCommand } from './RemoveUserConnectionIdCommand.js';

export class RemoveUserConnectionIdCommandHandler implements Handler<RemoveUserConnectionIdCommand, void> {
    public async handle(request: RemoveUserConnectionIdCommand): Promise<Result<void>> {
        try {
            const repo = new UserRepository();

            const user = await repo.get(false);

            const updatedConnectionIds = user.connectionIds.filter(uc => uc.connectionId !== request.connectionId);

            await repo.update({ connectionIds: updatedConnectionIds });

            return Result.success();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('AddConnectionId Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, 'AddConnectionId Failed'));
        }
    }
}
