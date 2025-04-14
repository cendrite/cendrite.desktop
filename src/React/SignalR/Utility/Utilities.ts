import {HubConnection, HubConnectionState} from "@microsoft/signalr";

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