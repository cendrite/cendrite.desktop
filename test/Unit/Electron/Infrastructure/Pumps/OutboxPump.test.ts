import { describe, expect, test, vi } from 'vitest';
import { OutboxPump } from '../../../../../src/Electron/Infrastructure/Pumps/OutboxPump.js';
import { IOutboxRepository } from '../../../../../src/Electron/Infrastructure/Interfaces/IOutboxRepository.js';
import { IChatStore } from '../../../../../src/Electron/Application/Contracts/Repositories/IChatStore.js';
import { ILedgerWriter } from '../../../../../src/Electron/Application/Contracts/Services/ILedgerWriter.js';
import { Mediator } from '../../../../../src/Electron/Application/Mediator/Mediator.js';
import { SignalManager } from '../../../../../src/Electron/Infrastructure/Signal/SignalManager.js';
import { PayloadType } from '../../../../../src/Electron/Application/Contracts/Messaging/Envelope.js';
import { DeliveryStatus } from '../../../../../src/Electron/Domain/Enums/DeliveryStatus.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { DomainEvent } from '../../../../../src/Electron/Domain/Events/IDomainEvent.js';
import { EnvelopeQueuedEvent } from '../../../../../src/Electron/Domain/Events/EnvelopeQueuedEvent.js';
import { LedgerOperationQueuedEvent } from '../../../../../src/Electron/Domain/Events/LedgerOperationQueuedEvent.js';
import { MessageSentEvent } from '../../../../../src/Electron/Domain/Events/MessageSentEvent.js';
import { MessageContract } from '../../../../../src/Electron/Application/Contracts/Models/MessageContract.js';
import { Message } from '../../../../../src/Electron/Domain/Entities/Message.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

const operation = {
    type: LedgerOperationType.GroupCreated as const,
    authorTag: 'alice',
    at: 1,
    name: 'Trip',
    members: [],
};

function message(): MessageContract {
    return new MessageContract('msg-1', GROUP_ID, 'conn-1', 'hello', new Date(), [], DeliveryStatus.Pending, 'token');
}

function harness(queued: DomainEvent[]) {
    const done: string[] = [];
    const steps: string[] = [];

    const eventRepository = {
        getNext: async () => queued.shift() ?? null,
        markEventAsProcessed: async (id: string) => void done.push(id),
        markAsFailed: async (id: string) => void done.push(`failed:${id}`),
    } as unknown as IOutboxRepository;

    const chatStore = {
        getMessage: async () =>
            new Message('msg-1', GROUP_ID, 'conn-1', new Date(), 'hello', [], DeliveryStatus.Pending, 'token'),
        markMessage: async () => undefined,
    } as unknown as IChatStore;

    const ledgerWriter = {
        createStream: async () => {
            steps.push('ledger');
            return Result.success<void>();
        },
        append: async () => Result.success<void>(),
    } as unknown as ILedgerWriter;

    const mediator = {
        send: async (request: { type: string }) => {
            steps.push(request.type === 'SendEnvelopeCommand' ? 'envelope' : 'message');
            return Result.success(DeliveryStatus.Sent);
        },
    } as unknown as Mediator;

    const mainWindow = { webContents: { send: vi.fn() } } as unknown as Electron.BrowserWindow;
    const signalManager = { isConnected: () => true } as unknown as SignalManager;

    const pump = new OutboxPump(eventRepository, chatStore, ledgerWriter, mediator, mainWindow, signalManager);

    return { pump, steps, done };
}

/** The pump loops until stopped, so each test lets the queue drain and then stops it. */
async function drain(pump: OutboxPump): Promise<void> {
    pump.start();
    await new Promise((resolve) => setTimeout(resolve, 30));
    pump.stop();
}

describe('the outbox pump', () => {
    test('drains in the order things were queued', async () => {
        const h = harness([
            new LedgerOperationQueuedEvent('e1', GROUP_ID, operation, true, new Date()),
            new EnvelopeQueuedEvent('e2', PayloadType.GroupCreated, {}, ['bob-device'], new Date()),
            new MessageSentEvent('e3', message(), ['bob-device'], ['alice', 'bob'], new Date()),
        ]);

        await drain(h.pump);

        // The stream exists before anyone is told about it, and the message follows the telling.
        expect(h.steps).toEqual(['ledger', 'envelope', 'message']);
        expect(h.done).toEqual(['e1', 'e2', 'e3']);
    });

    test('marks an event failed rather than stalling the queue behind it', async () => {
        const h = harness([new MessageSentEvent('e1', message(), [], [], new Date())]);

        await drain(h.pump);

        expect(h.done).toEqual(['e1']);
    });
});
