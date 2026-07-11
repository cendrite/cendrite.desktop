import { Result } from '../../../../../../Shared/Result/Result.js';
import { ProtocolStore } from '../../../../../Infrastructure/Persistence/Repositories/ProtocolStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { GetRegistrationIdQuery } from './GetRegistrationIdQuery.js';

export class GetRegistrationIdQueryHandler implements Handler<GetRegistrationIdQuery, number> {
    public async handle(_request: GetRegistrationIdQuery): Promise<Result<number>> {
        const store = new ProtocolStore();

        const regId = await store.getRegistrationId();

        return Result.success<number>(regId);
    }
}
