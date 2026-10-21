import { HubConnection } from '@microsoft/signalr';
import { IHubHandler } from '../IHubHandler.js';
import { HubKey } from '../SignalRHubPath.js';
import { HubMethods } from '../HubMethods.js';
import { IMessageHubHandler, ServerMessage } from '#electron/Application/Contracts/Services/IMessageHubHandler';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { IMessageReceiver } from './MessageReceiver.js';

type ServerMessageDto = {
    id: string;
    senderId: string;
    recipientId: string;
    payload: string;
    timestamp: Date;
    messageToken: string | null;
};

const toServerMessage = (dto: ServerMessageDto): ServerMessage =>
    new ServerMessage(dto.id, dto.senderId, dto.recipientId, dto.payload);

export class MessageHubHandler implements IHubHandler, IMessageHubHandler {
    public readonly key: HubKey = 'Messaging';
    private isInitialized: boolean = false;
    private connection?: HubConnection;

    constructor(private readonly messageReceiver: IMessageReceiver) { }

    public initialize(connection: HubConnection) {
        if (this.isInitialized) {
            throw new Error('ChangeEventReceiver is already initialized');
        }

        connection.on(HubMethods.ReceiveMessage, (message: ServerMessageDto) => {
            const concreteMessage = toServerMessage(message);
            console.log('Server message', message);
            this.publish(concreteMessage);
        });

        console.log('MessageReceiver: initialized');
        this.connection = connection;
        this.isInitialized = true;
    }

    publish(message: ServerMessage): void {
        console.log('MessageHubHandler: publish', message);
        this.messageReceiver.handle(message);
    }

    public async sendMessage(messages: ServerMessage[]): Promise<DeliveryStatus> {
        if (!this.isInitialized || !this.connection) {
            return Promise.reject(new Error('MessageReceiver is not initialized'));
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
