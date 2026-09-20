import { MessageContract } from '../Electron/Application/Contracts/Models/MessageContract';
import { ChangeEvent } from '../Electron/Infrastructure/Signal/ChangeEvent/ChangeEvent.ts';
import { DeliveryStatus } from '../Electron/Domain/Enums/DeliveryStatus.ts';
import { Theme as AppTheme } from './Theme.ts';

declare global {
    type ConnectionState = 'connected' | 'disconnected' | 'connecting';

    type MediatorRequest = {
        type: string;
    };

    type EventMessage =
        | { kind: 'message'; message: MessageContract }
        | { kind: 'deliveryStatus'; chatId: string; messageIds: string[]; status: DeliveryStatus }
        | { kind: 'textEdit'; messageId: string; newText: string }
        | { kind: 'delete'; messageId: string };

    interface AppEventMap {
        changeEvent: ChangeEvent;
        connectionState: ConnectionState;
        eventMessage: EventMessage;
    }

    type AppEvent = keyof AppEventMap;

    type Theme = AppTheme;

    interface Window {
        electron: {
            initialTheme: Theme;
            sendRequestAsync: <TResponse>(request: MediatorRequest) => Promise<TResponse>;
            on: <TEvent extends AppEvent>(event: TEvent, callback: (data: AppEventMap[TEvent]) => void) => () => void;
        };
    }
}
