import { HubConnection } from '@microsoft/signalr';
import { IHubHandler } from '../IHubHandler.js';
import { HubKey } from '../SignalRHubPath.js';
import { PayloadType, ServerMessage, ServerMessageDto } from './ServerMessage.js';
import { HubMethods } from '../HubMethods.js';
import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';
import { MessageHandler } from './Subscribers.js';

export class MessageHubHandler implements IHubHandler {
    public readonly key: HubKey = 'Messaging';
    private isInitialized: boolean = false;
    private connection?: HubConnection;
    private readonly subscribers = new Map<PayloadType, Set<MessageHandler>>();

    public initialize(connection: HubConnection) {
        if (this.isInitialized) {
            throw new Error('ChangeEventReceiver is already initialized');
        }

        connection.on(HubMethods.ReceiveMessage, (message: ServerMessageDto) => {
            const concreteMessage = ServerMessage.fromDto(message);
            console.log('Server message', message);
            this.publish(concreteMessage);
        });

        console.log('MessageReceiver: initialized');
        this.connection = connection;
        this.isInitialized = true;
    }

    subscribe(payloadType: PayloadType, handler: MessageHandler): void {
        if (!this.subscribers.has(payloadType)) {
            this.subscribers.set(payloadType, new Set<MessageHandler>());
        }
        this.subscribers.get(payloadType)!.add(handler);
    }

    unsubscribe(payloadType: PayloadType, handler: MessageHandler): void {
        (this.subscribers.get(payloadType) as Set<MessageHandler>)?.delete(handler);
    }

    publish(message: ServerMessage): void {
        console.log('MessageHubHandler: publish', message.payloadType, message);
        if (this.subscribers.has(message.payloadType)) {
            this.subscribers.get(message.payloadType)!.forEach((handler) => handler(message));
        }
    }

    public async sendMessage(messages: ServerMessage[]): Promise<DeliveryStatus> {
        if (!this.isInitialized || !this.connection) {
            return Promise.reject(new Error('MessageReceiver is not initialized'));
        }
        if (messages.some((m) => m.messageToken === null)) {
            throw new Error('Cannot send message without a token');
        }
        try {
            const receipt = await this.connection.invoke<DeliveryStatus>(HubMethods.SendMessage, messages);
            return receipt;
        } catch (error) {
            console.error('Failed to send message', error);
            return Promise.reject(error);
        }
    }

    dispose(): void {
        if (this.connection) {
            this.connection.off(HubMethods.ReceiveMessage);
            this.connection = undefined;
        }
        this.isInitialized = false;
    }
}
