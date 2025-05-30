import {HubConnection, HubConnectionBuilder} from '@microsoft/signalr';
import {HubKey, HubPaths} from "./SignalRHubPath.ts";
import {TokenManager} from "../Token/TokenManager.ts";
import {IHubReceiver} from "./IHubReceiver.ts";
import {ChangeEventReceiver} from "./ChangeEvent/ChangeEventReceiver.ts";
import {MessageReceiver} from "./Messaging/MessageReceiver.ts";


export class SignalManager {
    private static instance: SignalManager;
    private connections: Map<HubKey, HubConnection> = new Map();
    private readonly receivers: IHubReceiver[] = [
        new ChangeEventReceiver(),
        new MessageReceiver()
    ];

    private constructor() {
    }

    public static getInstance(): SignalManager {
        if (!SignalManager.instance)
            SignalManager.instance = new SignalManager();
        return SignalManager.instance;
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
                if (this.connections.has(key as HubKey)) {
                    console.log("Connection for: ", key, " already exists");
                    continue;
                }
                await connection.start();
                this.connections.set(key as HubKey, connection);


            } catch (error) {
                console.log(`Failed to connect to ${hubPath}`, error);
            }
        }

        this.receivers.forEach(r => {
            const conn = this.connections.get(r.key);
            if (!conn) {
                throw new Error(`No connection for receiver ${r.key}`);
            }
            console.log(`Initializing receiver for hub ${r.key}`);
            r.initialize(conn);
        })
    }

    public async disconnect() {
        this.connections.forEach(c => c.stop());
        this.connections.clear();
        this.receivers.forEach(r => r.dispose());
    }

    public getConnection(hubPath: HubKey): HubConnection | undefined {
        return this.connections.get(hubPath);
    }

    public getReceiver<T extends IHubReceiver>(key: HubKey): T {
        const receiver = this.receivers.find(r => r.key === key);
        if (!receiver) {
            throw new Error(`No IHubReceiver for hub ${key}`);
        }
        return receiver as T;
    }
}