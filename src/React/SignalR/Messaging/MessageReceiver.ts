import {HubConnection} from "@microsoft/signalr";
import {IHubReceiver} from "../IHubReceiver.ts";
import {HubKey} from "../SignalRHubPath.ts";
import {HubMethods} from "../HubMethods.ts";

export class MessageReceiver implements IHubReceiver {
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

    dispose(): void {
        if (this.connection) {
            this.connection.off(HubMethods.ReceiveMessage);
            this.connection = undefined;
        }
        this.isInitialized = false;
    }
}