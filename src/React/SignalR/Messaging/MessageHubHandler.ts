import { HubConnection } from '@microsoft/signalr';
import { IHubHandler } from '../IHubHandler.ts';
import { HubKey } from '../SignalRHubPath.ts';
import { HubMethods } from '../HubMethods.ts';
import { ServerChatMessage } from './ServerChatMessage.ts';
import { MessageReceipt } from './MessageReceipt.ts';
import { Topic, TopicHandler, TopicKey } from './Subscribers.ts';

export class MessageHubHandler implements IHubHandler {
    public readonly key: HubKey = 'Messaging';
    private isInitialized: boolean = false;
    private connection?: HubConnection;
    private readonly subscribers = new Map<TopicKey, Set<unknown>>();

    public initialize(connection: HubConnection) {
        if (this.isInitialized) {
            throw new Error('ChangeEventReceiver is already initialized');
        }

        connection.on(HubMethods.ReceiveMessage, (message: ServerChatMessage) => {
            console.log('Server message', message);
            this.publish('chat', message);
        });

        console.log('MessageReceiver: initialized');
        this.connection = connection;
        this.isInitialized = true;
    }

    subscribe<K extends TopicKey>(topic: K, handler: TopicHandler<K>): void {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }

        (this.subscribers.get(topic)! as Set<TopicHandler<K>>).add(handler);
    }

    unsubscribe<K extends TopicKey>(topic: K, handler: TopicHandler<K>): void {
        (this.subscribers.get(topic) as Set<TopicHandler<K>>)?.delete(handler);
    }

    publish<K extends TopicKey>(topic: K, payload: Topic[K]): void {
        (this.subscribers.get(topic) as Set<TopicHandler<K>> | undefined)?.forEach((h) => h(payload));
    }

    public async sendMessage(messages: ServerChatMessage[]): Promise<MessageReceipt> {
        if (!this.isInitialized || !this.connection) {
            return Promise.reject(new Error('MessageReceiver is not initialized'));
        }
        if (messages.some((m) => m.messageToken === null)) {
            throw new Error('Cannot send message without a token');
        }
        try {
            console.log('Sending messages', messages);
            const receipt = await this.connection.invoke<MessageReceipt>(HubMethods.SendMessage, messages);
            console.log('Message sent successfully', receipt);
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
