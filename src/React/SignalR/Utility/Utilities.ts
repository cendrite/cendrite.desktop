import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { useEffect, useRef } from 'react';
import { ChangeEvent } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEvent.ts';
import { ChangeEventType } from '../../../Electron/Infrastructure/Signal/ChangeEvent/ChangeEventType.ts';

export function waitForConnection(connection: HubConnection): Promise<void> {
    if (connection.state === HubConnectionState.Connected) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const checkConnection = () => {
            if (connection.state === HubConnectionState.Connected) {
                console.log('Connection established for: ', connection.baseUrl);
                resolve();
            } else if (
                connection.state === HubConnectionState.Disconnected ||
                connection.state === HubConnectionState.Disconnecting
            ) {
                reject(new Error('Connection failed'));
            } else {
                console.log('Waiting for connection...');
                setTimeout(checkConnection, 1000);
            }
        };
        checkConnection();
    });
}

export function useSignalEvent<T>(type: ChangeEventType, handler: (event: ChangeEvent<T>) => void) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        return window.electron.on('changeEvent', (evt) => {
            if (evt.type !== type) return;
            handlerRef.current(evt as ChangeEvent<T>);
        });
    }, [type]);
}
