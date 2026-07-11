import { Result } from '../../../../../../../Shared/Result/Result.js';
import { SessionRecord } from '../../../../../../Domain/Encryption/SessionRecord.js';
import { ProtocolStore } from '../../../../../../Infrastructure/Persistence/Repositories/ProtocolStore.js';
import { Handler } from '../../../../../Mediator/Handler.js';
import { CreateSessionCommand } from './CreateSessionCommand.js';

export class CreateSessionCommandHandler implements Handler<CreateSessionCommand> {
    public async handle(request: CreateSessionCommand): Promise<Result> {
        const store = new ProtocolStore();

        const sessionRecord = new SessionRecord(request.encodedAddress, request.record);

        await store.storeSession(sessionRecord);

        return Result.success();
    }
}
