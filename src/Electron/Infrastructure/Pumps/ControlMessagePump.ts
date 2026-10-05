import { IGroupControlSender } from '../../Application/Contracts/Services/IGroupControlSender.js';
import { Payload } from '../../Application/Contracts/Messaging/Envelope.js';
import { ControlMessageQueuedEvent } from '../../Domain/Events/ControlMessageQueuedEvent.js';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { SignalManager } from '../Signal/SignalManager.js';
import { Pump } from './Pump.js';

export class ControlMessagePump extends Pump {
    constructor(
        private readonly eventRepository: IOutboxRepository,
        private readonly groupControlSender: IGroupControlSender,
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

            const queued = await this.eventRepository.getEvent<ControlMessageQueuedEvent>(
                ControlMessageQueuedEvent.type,
            );

            if (!queued) {
                await this.sleep(1_000);
                continue;
            }

            try {
                await this.groupControlSender.send(
                    queued.payloadType,
                    queued.payload as Payload,
                    queued.connectionIds,
                );
                await this.eventRepository.markEventAsProcessed(queued.id);
            } catch (error) {
                console.error('ControlMessagePump: failed to send control message', error);
                await this.eventRepository.markAsFailed(queued.id, String(error));
            }
        }
    }
}
