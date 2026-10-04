import { ILedgerWriter } from '../../Application/Contracts/Services/ILedgerWriter.js';
import { LedgerOperationQueuedEvent } from '../../Domain/Events/LedgerOperationQueuedEvent.js';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { Pump } from './Pump.js';

export class LedgerPump extends Pump {
    constructor(
        private readonly eventRepository: IOutboxRepository,
        private readonly ledgerWriter: ILedgerWriter,
    ) {
        super();
    }

    protected async process(): Promise<void> {
        while (this.isRunning) {
            const queued = await this.eventRepository.getEvent<LedgerOperationQueuedEvent>(
                LedgerOperationQueuedEvent.type,
            );

            if (!queued) {
                await this.sleep(1_000);
                continue;
            }

            const result = queued.createsStream
                ? await this.ledgerWriter.createStream(queued.groupId, queued.operation)
                : await this.ledgerWriter.append(queued.groupId, queued.operation);

            if (result.success) {
                await this.eventRepository.markEventAsProcessed(queued.id);
                continue;
            }

            console.error(`LedgerPump: ${queued.groupId} failed:`, result.errorMessage);
            await this.eventRepository.markAsFailed(queued.id, result.errorMessage?.message ?? 'Unknown error');
        }
    }
}
