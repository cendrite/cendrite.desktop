import { ServerMessageDto } from '../React/SignalR/Messaging/ServerMessage';

export type ConnectionState = 'connected' | 'disconnected' | 'connecting';

export interface AppEventMap {
    changeEvent: ChangeEvent;
    hubMessage: ServerMessageDto;
    connectionState: ConnectionState;
}
export type AppEvent = keyof AppEventMap;

declare global {
    type MediatorRequest = {
        type: string;
    };

    interface Window {
        electron: {
            sendRequestAsync: <TResponse>(request: MediatorRequest) => Promise<TResponse>;
            on: <TEvent extends AppEvent>(event: TEvent, callback: (data: AppEventMap[TEvent]) => void) => void;
        };
    }
}
