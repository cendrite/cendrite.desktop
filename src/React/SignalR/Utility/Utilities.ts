import {HubConnection, HubConnectionState} from "@microsoft/signalr";
import { ChangeEventType } from "../ChangeEvent/ChangeEventType";
import {SignalManager} from "../SignalManager.ts";
import {ChangeEvent, ChangeEventHandler} from "../ChangeEvent/ChangeEvent.ts";
import {useEffect} from "react";
import {ChangeEventHubHandler} from "../ChangeEvent/ChangeEventHubHandler.ts";
import {MessageHubHandler} from "../Messaging/MessageHubHandler.ts";
import { PayloadType } from "../Messaging/ServerMessage.ts";
import { MessageHandler } from "../Messaging/Subscribers.ts";

export function waitForConnection(connection: HubConnection): Promise<void> {
    if (connection.state === HubConnectionState.Connected) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const checkConnection = () => {
            if (connection.state === HubConnectionState.Connected) {
                console.log("Connection established for: ", connection.baseUrl);
                resolve();
            } else if (
                connection.state === HubConnectionState.Disconnected ||
                connection.state === HubConnectionState.Disconnecting
            ) {
                reject(new Error("Connection failed"));
            } else {
                console.log("Waiting for connection...");
                setTimeout(checkConnection, 1000);
            }
        };
        checkConnection();
    });
}

export function useSignalEvent<T>(
    type: ChangeEventType,
    handler: (event: ChangeEvent<T>) => void
) {
    const receiver = SignalManager
        .getInstance()
        .getHandler<ChangeEventHubHandler>("ChangeEvents");

    useEffect(() => {
        receiver.subscribe(type, handler as ChangeEventHandler);
        return () => {
            receiver.unsubscribe(type, handler as ChangeEventHandler);
        };
    }, [receiver, type, handler]);
}

export function useSignalMessage(
    type: PayloadType,
    handler: MessageHandler): void {
    const receiver = SignalManager
        .getInstance()
        .getHandler<MessageHubHandler>("Messaging");

    useEffect(() => {
        receiver.subscribe(type, handler);
        return () => {
            receiver.unsubscribe(type, handler);
        };
    }, [receiver, type, handler]);
}

