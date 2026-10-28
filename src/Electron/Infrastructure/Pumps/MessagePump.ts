import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { MessageSentCommand } from '#electron/Application/Features/Chat/Events/MessageSentEventHandler';
import { Mediator } from '#electron/Application/Mediator/Mediator';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { MessageSentEvent } from '#electron/Domain/Events/MessageSentEvent';
import { IOutboxRepository } from '../Interfaces/IOutboxRepository.js';
import { SignalManager } from '../Signal/SignalManager.js';
import { Pump } from './Pump.js';

export class MessagePump extends Pump {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly eventRepository: IOutboxRepository,
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

            const msgEvent = await this.eventRepository.getEvent<MessageSentEvent>(MessageSentEvent.type);

            if (!msgEvent) {
                await this.sleep(1_000);
                continue;
            }

            const pendingMessage = await this.chatStore.getMessage(msgEvent.message.chatId, msgEvent.message.id);

            if (!pendingMessage) {
                console.error(
                    `MessagePump: Message with ID ${msgEvent.message.id} not found in chat ${msgEvent.message.chatId}`,
                );
                await this.eventRepository.deleteEvent(msgEvent.id);
                continue;
            }

            const result = await this.mediator.send(
                new MessageSentCommand(
                    msgEvent.message,
                    msgEvent.connectionIds,
                    msgEvent.participants,
                    msgEvent.payloads,
                ),
            );

            let deliveryStatus: DeliveryStatus;
            if (result.success) {
                deliveryStatus = result.data;
            } else {
                deliveryStatus = DeliveryStatus.Failed;
            }

            await this.chatStore.markMessage(pendingMessage.id, deliveryStatus);
            await this.eventRepository.deleteEvent(msgEvent.id);

            this.mainWindow.webContents.send('eventMessage', {
                kind: 'deliveryStatus',
                chatId: pendingMessage.chatId,
                messageIds: [pendingMessage.id],
                status: deliveryStatus,
            });
        }
    }
}
