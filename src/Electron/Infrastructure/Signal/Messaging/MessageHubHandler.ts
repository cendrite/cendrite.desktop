import { HubConnection } from '@microsoft/signalr';
import { IHubHandler } from '../IHubHandler.js';
import { HubKey } from '../SignalRHubPath.js';
import { ServerMessage, ServerMessageDto } from './ServerMessage.js';
import { HubMethods } from '../HubMethods.js';
import { DeliveryStatus } from '../../../Domain/Enums/DeliveryStatus.js';
import { BrowserWindow } from 'electron';

export class MessageHubHandler implements IHubHandler {
    public readonly key: HubKey = 'Messaging';
    private readonly mainWindow: Electron.BrowserWindow;
    private isInitialized: boolean = false;
    private connection?: HubConnection;

    public constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

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

    publish(message: ServerMessage): void {
        // Encryption should be moved in here and a proper Message Contract should be defined here
        console.log('MessageReceiver: publish', message.payloadType, message);
        throw new Error('Method not implemented.');
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
