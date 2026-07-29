import {HubConnection} from "@microsoft/signalr";
import { HubKey } from "./SignalRHubPath.js";

export interface IHubHandler {
    key: HubKey;
    initialize: (connection: HubConnection) => void;
    dispose: () => void;
}

