import { MessageContract } from '../Electron/Application/Contracts/Models/MessageContract';
import { ChangeEvent } from '../React/SignalR/ChangeEvent/ChangeEvent';

declare global {
    type ConnectionState = 'connected' | 'disconnected' | 'connecting';

    type MediatorRequest = {
        type: string;
    };

    interface AppEventMap {
        changeEvent: ChangeEvent;
        hubMessage: MessageContract;
        connectionState: ConnectionState;
    }
    type AppEvent = keyof AppEventMap;

    interface Window {
        electron: {
            sendRequestAsync: <TResponse>(request: MediatorRequest) => Promise<TResponse>;
            on: <TEvent extends AppEvent>(event: TEvent, callback: (data: AppEventMap[TEvent]) => void) => () => void;
        };
    }
}
