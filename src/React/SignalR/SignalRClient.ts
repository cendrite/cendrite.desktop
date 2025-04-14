import {HubConnection, HubConnectionBuilder} from '@microsoft/signalr';
import {HUB_PATHS} from "./SignalRHubPath.ts";
import {TokenManager} from "../Token/TokenManager.ts";
import ChangeEventManger from "./ChangeEvent/ChangeEventManager.ts";


type HubPathKey = keyof typeof HUB_PATHS;

export class SignalRClient {
    private static instance: SignalRClient;
    private connection: Map<HubPathKey, HubConnection> = new Map();
    private eventManger = ChangeEventManger.getInstance();
    private constructor() {
    }

    public static getInstance(): SignalRClient {
        if (!SignalRClient.instance)
            SignalRClient.instance = new SignalRClient();
        return SignalRClient.instance;
    }

    public async connect() {
        for (const key in HUB_PATHS) {
            const hubPath = HUB_PATHS[key as HubPathKey];
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
                if(this.connection.has(key as HubPathKey)) {
                    console.log("Connection for: ", key, " already exists");
                    continue;
                }
                await connection.start();
                this.connection.set(key as HubPathKey, connection);

                await this.intializeManagers();
            } catch (error) {
                console.log(`Failed to connect to ${hubPath}`, error);
            }
        }
    }

    public async disconnect() {
        for (const key in HUB_PATHS) {
            const hubPath = HUB_PATHS[key as HubPathKey];
            const connection = this.connection.get(key as HubPathKey);
            if(connection) {
                await connection.stop();
                this.connection.delete(key as HubPathKey);
                console.log(`Disconnected from ${hubPath}`);
            }
        }
    }

    public getConnection(hubPath: HubPathKey): HubConnection | undefined {
        return this.connection.get(hubPath);
    }

    private async intializeManagers(): Promise<void>{
        await this.eventManger.initialize();
    }
}