import {HubConnection} from "@microsoft/signalr";
import { HubKey } from "./SignalRHubPath";

export interface IHubHandler {
    key: HubKey;
    initialize: (connection: HubConnection) => void;
    dispose: () => void;
}

