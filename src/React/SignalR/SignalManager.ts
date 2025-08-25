import {HubConnection, HubConnectionBuilder} from '@microsoft/signalr';
import {HubKey, HubPaths} from "./SignalRHubPath.ts";
import {IHubHandler} from "./IHubHandler.ts";
import {ChangeEventHubHandler} from "./ChangeEvent/ChangeEventHubHandler.ts";
import {MessageHubHandler} from "./Messaging/MessageHubHandler.ts";
import {TokenManager} from "../Security/Tokens/TokenManager.ts";


export class SignalManager {
    private static _instance: SignalManager;
    private _connections: Map<HubKey, HubConnection> = new Map();
    private readonly _handlers: IHubHandler[] = [
        new ChangeEventHubHandler(),
        new MessageHubHandler(),
    ];

    private constructor() {
    }

    public static getInstance(): SignalManager {
        if (!SignalManager._instance)
            SignalManager._instance = new SignalManager();
        return SignalManager._instance;
    }

    public async connect() {
        for (const key in HubPaths) {
            const hubPath = HubPaths[key as HubKey];
            const connection = new HubConnectionBuilder()
                .withUrl(hubPath, {
                    accessTokenFactory: () => {
                        const tokenManager = TokenManager.getInstance();
                        return tokenManager.getJwt();
                    }
                })
                .withAutomaticReconnect()
                .build();
            try {
                if (this._connections.has(key as HubKey)) {
                    console.log("Connection for: ", key, " already exists");
                    continue;
                }
                await connection.start();
                this._connections.set(key as HubKey, connection);


            } catch (error) {
                console.log(`Failed to connect to ${hubPath}`, error);
            }
        }

        this._handlers.forEach(r => {
            const conn = this._connections.get(r.key);
            if (!conn) {
                throw new Error(`No connection for receiver ${r.key}`);
            }
            console.log(`Initializing receiver for hub ${r.key}`);
            r.initialize(conn);
        })
    }

    public async disconnect() {
        this._connections.forEach(c => c.stop());
        this._connections.clear();
        this._handlers.forEach(r => r.dispose());
    }

    public getConnection(hubPath: HubKey): HubConnection | undefined {
        return this._connections.get(hubPath);
    }

    public getHandler<T extends IHubHandler>(key: HubKey): T {
        const receiver = this._handlers.find(r => r.key === key);
        if (!receiver) {
            throw new Error(`No IHubReceiver for hub ${key}`);
        }
        return receiver as T;
    }
}