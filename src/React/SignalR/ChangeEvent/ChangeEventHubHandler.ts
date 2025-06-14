import {HubConnection} from "@microsoft/signalr";
import {IHubHandler} from "../IHubHandler.ts";
import {ChangeEventType} from "./ChangeEventType.ts";
import {ChangeEvent, ChangeEventHandler} from "./ChangeEvent.ts";
import {HubMethods} from "../HubMethods.ts";
import {HubKey} from "../SignalRHubPath.ts";


export class ChangeEventHubHandler implements IHubHandler {
    public readonly key: HubKey = "ChangeEvents";
    private isInitialized: boolean = false;
    private connection?: HubConnection;
    private subscribers = new Map<ChangeEventType, Set<ChangeEventHandler>>

    public initialize(connection: HubConnection) {
        if (this.isInitialized) {
            throw new Error("ChangeEventReceiver is already initialized");
        }

        connection.on(HubMethods.ChangeNotification, (event: ChangeEvent) => {
            this.publish(event);
        })

        console.log("ChangeEventReceiver: initialized");
        this.connection = connection;
        this.isInitialized = true;
    }

    public subscribe(eventType: ChangeEventType, handler: ChangeEventHandler): void {
        console.log("ChangeEventReceiver: subscribe", eventType);
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set<ChangeEventHandler>());
        }

        this.subscribers.get(eventType)!.add(handler);
    }

    public unsubscribe(type: ChangeEventType, handler: ChangeEventHandler): void {
        console.log("ChangeEventReceiver: unsubscribe", type);
        if (this.subscribers.has(type)) {
            this.subscribers.get(type)!.delete(handler);
        }
    }

    private publish(event: ChangeEvent): void {
        console.log("ChangeEventReceiver: publish", event);
        if (this.subscribers.has(event.type)) {
            this.subscribers.get(event.type)!.forEach(handler => handler(event));
        }
    }

    public dispose(): void {
        if (this.connection) {
            this.connection.off(HubMethods.ChangeNotification);
            this.connection = undefined;
        }

        this.subscribers.forEach(h => h.clear());
        this.subscribers.clear();
        this.isInitialized = false;
    }
}