import {HubConnection} from "@microsoft/signalr";
import {IHubHandler} from "../IHubHandler.ts";
import {HubKey} from "../SignalRHubPath.ts";
import {HubMethods} from "../HubMethods.ts";
import {ServerChatMessage} from "./ServerChatMessage.ts";
import {MessageReceipt} from "./MessageReceipt.ts";

export class MessageHubHandler implements IHubHandler {
    public readonly key: HubKey = "Messaging";
    private isInitialized: boolean = false;
    private connection?: HubConnection;

    public initialize(connection: HubConnection) {
        if (this.isInitialized) {
            throw new Error("ChangeEventReceiver is already initialized");
        }

        connection.on(HubMethods.ReceiveMessage, (message: string) => {
            console.log("Received message", message);
        });

        console.log("MessageReceiver: initialized");
        this.connection = connection;
        this.isInitialized = true;
    }

    public async sendMessage(messages: ServerChatMessage[]): Promise<MessageReceipt>{
        if(!this.isInitialized || !this.connection) {
            return Promise.reject(new Error("MessageReceiver is not initialized"));
        }
        if(messages.some(m=> m.messageToken === null)) {
            throw new Error("Cannot send message without a token");
        }
        try {
            const receipt = await this.connection.invoke<MessageReceipt>(HubMethods.SendMessage, messages);
            console.log("Message sent successfully", receipt);
            return receipt;
        } catch (error) {
            console.error("Failed to send message", error);
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