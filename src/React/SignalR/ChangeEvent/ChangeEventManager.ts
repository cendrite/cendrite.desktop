import {ChangeEventType} from "./ChangeEventType.ts";
import {ChangeEvent} from "./ChangeEvent.ts";
import {waitForConnection} from "../Utility/Utilities.ts";
import {SignalRClient} from "../SignalRClient.ts";


export type ChangeEventHandler = (event: ChangeEvent) => void;

class ChangeEventManger{
    private static instance: ChangeEventManger;
    private isInitialized = false;
    private subscribers = new Map<ChangeEventType, Set<ChangeEventHandler>>

    static getInstance(): ChangeEventManger {
        if (!ChangeEventManger.instance) {
            ChangeEventManger.instance = new ChangeEventManger();
        }
        return ChangeEventManger.instance;
    }
    private constructor() {
        this.subscribers = new Map<ChangeEventType, Set<ChangeEventHandler>>();
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            throw new Error("ChangeEventManager is already initialized");
        }
        this.isInitialized = true;

        const client = SignalRClient.getInstance();
        const connection = client.getConnection("CHANGE_EVENTS");
        if (!connection) {
            throw new Error("Connection not found");
        }
        try {
            await waitForConnection(connection);

            connection.on("ChangeNotification", (event: ChangeEvent) => {
                console.log("Received event", event.type);
                this.publish(event);
            });

            console.log("ChangeEventManager initialized");
            this.isInitialized = true;
        } catch (error) {
            console.error("Failed to initialize ChangeEventManager:", error);
        }
    }

    public subscribe(type: ChangeEventType, handler: ChangeEventHandler): void {
        console.log("subscribing to event", type);
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set<ChangeEventHandler>());
        }
        this.subscribers.get(type)?.add(handler);
    }

    public unsubscribe(type: ChangeEventType, handler: ChangeEventHandler): void {
        console.log("unsubscribing from event", type);
        if (this.subscribers.has(type)) {
            this.subscribers.get(type)?.delete(handler);
        }
    }

    public publish(event: ChangeEvent): void {
        console.log("publishing event", event.type);
        if (this.subscribers.has(event.type)) {
            this.subscribers.get(event.type)?.forEach(handler => handler(event));
        }
    }
}

export default ChangeEventManger;