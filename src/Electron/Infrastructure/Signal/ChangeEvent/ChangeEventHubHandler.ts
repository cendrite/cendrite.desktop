import { HubConnection } from '@microsoft/signalr';
import { IHubHandler } from '../IHubHandler.js';
import { HubKey } from '../SignalRHubPath.js';
import { HubMethods } from '../HubMethods.js';
import { ChangeEvent } from '../../../../Shared/Contracts/Events/ChangeEvent.js';
import { BrowserWindow } from 'electron';

export class ChangeEventHubHandler implements IHubHandler {
    public readonly key: HubKey = 'ChangeEvents';
    private readonly mainWindow: BrowserWindow;
    private isInitialized: boolean = false;
    private connection?: HubConnection;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    public initialize(connection: HubConnection) {
        if (this.isInitialized) {
            throw new Error('ChangeEventReceiver is already initialized');
        }

        connection.on(HubMethods.ChangeNotification, (event: ChangeEvent) => {
            this.publish(event);
        });

        console.log('ChangeEventReceiver: initialized');
        this.connection = connection;
        this.isInitialized = true;
    }

    private publish(event: ChangeEvent): void {
        this.mainWindow.webContents.send('changeEvent', event);
    }

    public dispose(): void {
        if (this.connection) {
            this.connection.off(HubMethods.ChangeNotification);
            this.connection = undefined;
        }

        this.isInitialized = false;
    }
}
