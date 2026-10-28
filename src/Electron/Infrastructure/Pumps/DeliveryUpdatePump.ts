import { DeliveryStatusUpdatedCommand } from '#electron/Application/Features/Chat/Commands/DeliveryStatusUpdatedCommandHandler';
import { Mediator } from '#electron/Application/Mediator/Mediator';
import { DeliveryStatusUpdatedEvent } from '#electron/Domain/Events/DeliveryStatusUpdatedEvent';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { SignalManager } from '../Signal/SignalManager.js';
import { Pump } from './Pump.js';

export class DeliveryStatusUpdatePump extends Pump {
    constructor(
        private readonly eventRepository: IOutboxRepository,
        private readonly mediator: Mediator,
        private readonly signalManager: SignalManager,
    ) {
        super();
    }

    protected async process(): Promise<void> {
        while (this.isRunning) {
            if (!this.signalManager.isConnected('Messaging')) {
                console.log('DeliveryUpdatePump: Messaging hub is not connected, waiting...');
                await this.sleep(5_000);
                continue;
            }

            const deliveryEvent = await this.eventRepository.getEvent<DeliveryStatusUpdatedEvent>(
                DeliveryStatusUpdatedEvent.type,
            );

            if (!deliveryEvent) {
                await this.sleep(2_000);
                continue;
            }

            console.log(`DeliveryUpdatePump: Processing delivery status update event ${deliveryEvent.id}`);

            const result = await this.mediator.send(
                new DeliveryStatusUpdatedCommand(
                    deliveryEvent.senderId,
                    deliveryEvent.chatId,
                    deliveryEvent.messageIds,
                    deliveryEvent.connectionIds,
                    deliveryEvent.participants,
                    deliveryEvent.deliveryStatus,
                ),
            );

            if (result.success === false) {
                console.log(
                    `DeliveryUpdatePump: Failed to process delivery status update event ${deliveryEvent.id}: ${result.errorMessage?.message ?? 'Unknown error'}`,
                );
                await this.eventRepository.deleteEvent(deliveryEvent.id);
                continue;
            }

            await this.eventRepository.deleteEvent(deliveryEvent.id);
            console.log(`DeliveryUpdatePump: Successfully processed delivery status update event ${deliveryEvent.id}`);
        }
    }
}
