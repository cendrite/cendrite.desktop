import { IEventRepository } from '../../Application/Contracts/Providers/IEventRepository.js';
import { IChatStore } from '../../Application/Contracts/Repositories/IChatStore.js';
import { IPump } from '../../Application/Contracts/Services/IPump.js';
import { TransmitMessageCommand } from '../../Application/Features/Chat/Contracts/TransmitMessage.js';
import { Mediator } from '../../Application/Mediator/Mediator.js';
import { DeliveryStatus } from '../../Domain/Enums/DeliveryStatus.js';
import { TransmitMessageEvent } from '../../Domain/Events/TransmitMessageEvent.js';

export class MessagePump implements IPump {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly eventRepository: IEventRepository,
        private readonly mediator: Mediator,
        private readonly mainWindow: Electron.BrowserWindow,
    ) { }
    private isRunning: boolean = false;
    private wake: (() => void) | null = null;

    start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.process();
        }
    }

    stop(): void {
        this.isRunning = false;
        this.wake?.();
    }

    private async process(): Promise<void> {
        while (this.isRunning) {
            const msgEvents = await this.eventRepository.getEvents(TransmitMessageEvent.type, 1);
            const pendingMessage = await this.chatStore.getNextPendingMessage();

            if (!pendingMessage) {
                await this.sleep(30_000);
                continue;
            }

            const result = await this.mediator.send<TransmitMessageCommand, DeliveryStatus>(
                new TransmitMessageCommand(pendingMessage),
            );

            let deliveryStatus: DeliveryStatus;
            if (result.success) {
                deliveryStatus = result.data!;
            } else {
                deliveryStatus = DeliveryStatus.Failed;
            }

            await this.chatStore.markMessage(pendingMessage.id, deliveryStatus);

            this.mainWindow.webContents.send('messageEdit', {
                kind: 'deliveryStatus',
                chatId: pendingMessage.chatId,
                messageId: pendingMessage.id,
                status: deliveryStatus,
            });

            await this.sleep(30_000);
        }
    }

    public notify(): void {
        this.wake?.();
    }

    private sleep(timeoutMs: number): Promise<void> {
        return new Promise<void>((resolve) => {
            const done = () => {
                clearTimeout(timer);
                this.wake = null;
                resolve();
            };

            const timer = setTimeout(done, timeoutMs);
            this.wake = done;
        });
    }
}
