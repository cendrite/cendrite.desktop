import { IChatStore } from '../../Application/Contracts/Repositories/IChatStore.js';
import { ILedgerWriter } from '../../Application/Contracts/Services/ILedgerWriter.js';
import { MessageSentCommand } from '../../Application/Features/Chat/Contracts/SendMessage.js';
import { SendEnvelopeCommand } from '../../Application/Features/Chat/Contracts/SendEnvelope.js';
import { Mediator } from '../../Application/Mediator/Mediator.js';
import { DeliveryStatus } from '../../Domain/Enums/DeliveryStatus.js';
import { DomainEvent } from '../../Domain/Events/IDomainEvent.js';
import { EnvelopeQueuedEvent } from '../../Domain/Events/EnvelopeQueuedEvent.js';
import { LedgerOperationQueuedEvent } from '../../Domain/Events/LedgerOperationQueuedEvent.js';
import { MessageSentEvent } from '../../Domain/Events/MessageSentEvent.js';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { SignalManager } from '../Signal/SignalManager.js';
import { Pump } from './Pump.js';
import { tag } from '../../Utilities.js';

/**
 * One drain, in the order things were queued. A group's stream is written, its GroupCreated envelopes
 * go out, and the first message follows them onto the same hub, because that is the order they were
 * put in the outbox.
 */
export class OutboxPump extends Pump {
    constructor(
        private readonly eventRepository: IOutboxRepository,
        private readonly chatStore: IChatStore,
        private readonly ledgerWriter: ILedgerWriter,
        private readonly mediator: Mediator,
        private readonly mainWindow: Electron.BrowserWindow,
        private readonly signalManager: SignalManager,
    ) {
        super();
    }

    protected async process(): Promise<void> {
        while (this.isRunning) {
            if (!this.signalManager.isConnected('Messaging')) {
                await this.sleep(5_000);
                continue;
            }

            const event = await this.eventRepository.getNext();

            if (!event) {
                await this.sleep(1_000);
                continue;
            }

            try {
                await this.dispatch(event);
            } catch (error) {
                console.error(`${tag()} outbox: ${event.id} threw`, error);
                await this.eventRepository.markAsFailed(event.id, String(error));
            }
        }
    }

    private async dispatch(event: DomainEvent): Promise<void> {
        if (event instanceof LedgerOperationQueuedEvent) return this.writeToLedger(event);
        if (event instanceof EnvelopeQueuedEvent) return this.sendEnvelope(event);
        if (event instanceof MessageSentEvent) return this.sendMessage(event);

        console.warn(`${tag()} outbox: nothing handles ${event.constructor.name}, dropping it`);
        await this.eventRepository.markAsFailed(event.id, `No handler for ${event.constructor.name}`);
    }

    private async writeToLedger(event: LedgerOperationQueuedEvent): Promise<void> {
        const result = event.createsStream
            ? await this.ledgerWriter.createStream(event.groupId, event.operation)
            : await this.ledgerWriter.append(event.groupId, event.operation);

        if (!result.success) {
            console.error(
                `${tag()} ledger: write failed for ${event.groupId}: ${result.errorMessage?.code} ${result.errorMessage?.message}`,
            );
            await this.eventRepository.markAsFailed(event.id, result.errorMessage?.message ?? 'Unknown error');
            return;
        }

        console.log(`${tag()} ledger: wrote ${event.groupId}`);
        await this.eventRepository.markEventAsProcessed(event.id);
    }

    private async sendEnvelope(event: EnvelopeQueuedEvent): Promise<void> {
        const result = await this.mediator.send(
            new SendEnvelopeCommand(event.payloadType, event.payload, event.connectionIds),
        );

        if (!result.success) {
            await this.eventRepository.markAsFailed(event.id, result.errorMessage?.message ?? 'Unknown error');
            return;
        }

        console.log(`${tag()} outbox: sent type ${event.payloadType} to ${event.connectionIds.length} device(s)`);
        await this.eventRepository.markEventAsProcessed(event.id);
    }

    private async sendMessage(event: MessageSentEvent): Promise<void> {
        const pending = await this.chatStore.getMessage(event.message.chatId, event.message.id);

        if (!pending) {
            await this.eventRepository.markAsFailed(event.id, `Message ${event.message.id} is gone`);
            return;
        }

        const result = await this.mediator.send<MessageSentCommand, DeliveryStatus>(
            new MessageSentCommand(event.message, event.connectionIds, event.participants),
        );

        const deliveryStatus = result.success ? result.data! : DeliveryStatus.Failed;

        await this.chatStore.markMessage(pending.id, deliveryStatus);
        await this.eventRepository.markEventAsProcessed(event.id);

        this.mainWindow.webContents.send('eventMessage', {
            kind: 'deliveryStatus',
            chatId: pending.chatId,
            messageIds: [pending.id],
            status: deliveryStatus,
        });
    }
}
