import { describe, expect, test } from 'vitest';
import { LedgerPump } from '../../../../../src/Electron/Infrastructure/Pumps/LedgerPump.js';
import { ILedgerWriter } from '../../../../../src/Electron/Application/Contracts/Services/ILedgerWriter.js';
import { IOutboxRepository } from '../../../../../src/Electron/Infrastructure/Interfaces/IOutboxRepository.js';
import { LedgerOperationQueuedEvent } from '../../../../../src/Electron/Domain/Events/LedgerOperationQueuedEvent.js';
import { LedgerOperation } from '../../../../../src/Electron/Domain/Operations/LedgerOperation.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { DomainEvent } from '../../../../../src/Electron/Domain/Events/IDomainEvent.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

const operation: LedgerOperation = {
    type: LedgerOperationType.SettingsChanged,
    authorTag: 'alice',
    at: 1,
    name: 'Trip',
    messageTtl: null,
};

function outbox(queued: LedgerOperationQueuedEvent[]) {
    const processed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    const repository = {
        getEvents: async () => [],
        getEvent: async <T extends DomainEvent>() => (queued.shift() ?? null) as T | null,
        markEventAsProcessed: async (id: string) => void processed.push(id),
        markAsFailed: async (id: string, error: string) => void failed.push({ id, error }),
    } as unknown as IOutboxRepository;

    return { repository, processed, failed };
}

function writer(result: Result<void>) {
    const calls: { kind: 'create' | 'append'; groupId: string }[] = [];

    const ledgerWriter: ILedgerWriter = {
        createStream: async (groupId) => {
            calls.push({ kind: 'create', groupId });
            return result;
        },
        append: async (groupId) => {
            calls.push({ kind: 'append', groupId });
            return result;
        },
    };

    return { ledgerWriter, calls };
}

/** The pump loops until stopped, so each test lets one item drain and then stops it. */
async function drain(pump: LedgerPump): Promise<void> {
    pump.start();
    await new Promise((resolve) => setTimeout(resolve, 20));
    pump.stop();
}

describe('the ledger pump', () => {
    test('creates the stream when the operation says so', async () => {
        const queue = outbox([new LedgerOperationQueuedEvent('evt-1', GROUP_ID, operation, true, new Date())]);
        const w = writer(Result.success<void>());

        await drain(new LedgerPump(queue.repository, w.ledgerWriter));

        expect(w.calls).toEqual([{ kind: 'create', groupId: GROUP_ID }]);
        expect(queue.processed).toEqual(['evt-1']);
    });

    test('appends to an existing stream otherwise', async () => {
        const queue = outbox([new LedgerOperationQueuedEvent('evt-2', GROUP_ID, operation, false, new Date())]);
        const w = writer(Result.success<void>());

        await drain(new LedgerPump(queue.repository, w.ledgerWriter));

        expect(w.calls).toEqual([{ kind: 'append', groupId: GROUP_ID }]);
        expect(queue.processed).toEqual(['evt-2']);
    });

    test('marks the event failed instead of retrying forever', async () => {
        const queue = outbox([new LedgerOperationQueuedEvent('evt-3', GROUP_ID, operation, false, new Date())]);
        const w = writer(Result.fail<void>(new ErrorMessage('Forbidden', 'Invalid signature.')));

        await drain(new LedgerPump(queue.repository, w.ledgerWriter));

        expect(queue.processed).toEqual([]);
        expect(queue.failed).toEqual([{ id: 'evt-3', error: 'Invalid signature.' }]);
    });
});
