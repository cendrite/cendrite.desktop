import { Result } from '../../../../../../../Shared/Result/Result.js';
import { ProtocolStore } from '../../../../../../Infrastructure/Persistence/Repositories/ProtocolStore.js';
import { Handler } from '../../../../../Mediator/Handler.js';
import { DeletePreKeyCommand } from './DeletePreKeyCommand.js';

export class DeletePreKeyCommandHandler implements Handler<DeletePreKeyCommand> {
    public async handle(request: DeletePreKeyCommand): Promise<Result> {
        const store = new ProtocolStore();
        await store.deletePreKey(request.preKeyId);

        return Result.success();
    }
}
