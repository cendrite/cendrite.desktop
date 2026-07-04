import { ChangeEvent } from '../React/SignalR/ChangeEvent/ChangeEvent';
import { ServerMessageDto } from '../React/SignalR/Messaging/ServerMessage';

declare global {
    type ConnectionState = 'connected' | 'disconnected' | 'connecting';

    type MediatorRequest = {
        type: string;
    };

    interface AppEventMap {
        changeEvent: ChangeEvent;
        hubMessage: ServerMessageDto;
        connectionState: ConnectionState;
    }
    type AppEvent = keyof AppEventMap;

    interface Window {
        electron: {
            sendRequestAsync: <TResponse>(request: MediatorRequest) => Promise<TResponse>;
            on: <TEvent extends AppEvent>(event: TEvent, callback: (data: AppEventMap[TEvent]) => void) => void;
        };
    }
}
