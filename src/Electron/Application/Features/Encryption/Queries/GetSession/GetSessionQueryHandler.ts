import { Result } from '../../../../../../Shared/Result/Result.js';
import { ProtocolStore } from '../../../../../Persistence/Repositories/ProtocolStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { SessionRecordDto } from '../../Dtos/SessionRecordDto.js';
import { GetSessionQuery } from './GetSessionQuery.js';

export class GetSessionQueryHandler implements Handler<GetSessionQuery, SessionRecordDto | null> {
    public async handle(request: GetSessionQuery): Promise<Result<SessionRecordDto | null>> {
        const store = new ProtocolStore();

        const record = await store.getSession(request.encodedAddress);

        return record === null
            ? Result.success<SessionRecordDto | null>(null)
            : Result.success<SessionRecordDto | null>(new SessionRecordDto(record.encodedAddress, record.record));
    }
}
