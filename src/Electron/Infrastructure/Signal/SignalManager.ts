import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { HubKey, HubPaths } from './SignalRHubPath.js';
import { IHubHandler } from './IHubHandler.js';
import { ChangeEventHubHandler } from './ChangeEvent/ChangeEventHubHandler.js';
import { MessageHubHandler } from './Messaging/MessageHubHandler.js';
import { TokenManager } from '../Services/TokenManager.js';
import { ISignalManager } from '#electron/Application/Contracts/Services/ISignalManager';
import { BrowserWindow } from 'electron';
import { InfiniteRetryPolicy } from './RetryPolicy.js';

const REVOKED_CLOSE_REASON = 'client.revoked';

export class SignalManager implements ISignalManager {
    private readonly tokenManager: TokenManager;
    private readonly mainWindow: BrowserWindow;
    private _connections: Map<HubKey, HubConnection> = new Map();
    private readonly _handlers: IHubHandler[];

    public constructor(
        tokenManager: TokenManager,
        messageHubHandler: MessageHubHandler,
        changeEventHubHandler: ChangeEventHubHandler,
        mainWindow: BrowserWindow,
    ) {
        this.tokenManager = tokenManager;
        this._handlers = [changeEventHubHandler, messageHubHandler];
        this.mainWindow = mainWindow;
    }

    public async connect() {
        for (const key in HubPaths) {
            const hubPath = HubPaths[key as HubKey];
            const connection = new HubConnectionBuilder()
                .withUrl(hubPath, {
                    accessTokenFactory: () => this.tokenManager.getJwt(),
                })
                .withAutomaticReconnect(new InfiniteRetryPolicy(5000))
                .build();

            connection.onreconnecting(() => this.mainWindow.webContents.send('connectionState', 'connecting'));
            connection.onreconnected(() => this.mainWindow.webContents.send('connectionState', 'connected'));
            connection.onclose((error) =>
                this.mainWindow.webContents.send(
                    'connectionState',
                    error?.message.includes(REVOKED_CLOSE_REASON) ? 'revoked' : 'disconnected',
                ),
            );

            try {
                if (this._connections.has(key as HubKey)) {
                    console.log('Connection for: ', key, ' already exists');
                    continue;
                }
                await connection.start();
                this._connections.set(key as HubKey, connection);
            } catch (error) {
                console.log(`Failed to connect to ${hubPath}`, error);
            }
        }

        this._handlers.forEach((r) => {
            const conn = this._connections.get(r.key);
            if (!conn) {
                throw new Error(`No connection for receiver ${r.key}`);
            }
            console.log(`Initializing receiver for hub ${r.key}`);
            r.initialize(conn);
        });
    }

    public async disconnect() {
        if (this._connections.size === 0) return;
        this._connections.forEach((c) => c.stop());
        this._connections.clear();
        this._handlers.forEach((r) => r.dispose());
        this.mainWindow.webContents.send('connectionState', 'disconnected');
    }

    public getConnection(hubPath: HubKey): HubConnection | undefined {
        return this._connections.get(hubPath);
    }

    public isConnected(hubPath: HubKey): boolean {
        const connection = this._connections.get(hubPath);
        return connection?.state === 'Connected';
    }

    public getHandler<T extends IHubHandler>(key: HubKey): T {
        const receiver = this._handlers.find((r) => r.key === key);
        if (!receiver) {
            throw new Error(`No IHubReceiver for hub ${key}`);
        }
        return receiver as T;
    }
}
