import { MessageContract } from './Models/MessageContract';
import { ChangeEvent } from './Events/ChangeEvent.ts';
import { DeliveryStatus } from './Enums/DeliveryStatus.ts';
import { Theme as AppTheme } from './Theme.ts';
import { Result } from './Result/Result.ts';

declare global {
    type ConnectionState = 'connected' | 'disconnected' | 'connecting';

    type MediatorRequest<TResponse = unknown> = {
        readonly type: string;
        readonly _response?: TResponse;
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
            sendRequestAsync: <TResponse>(request: MediatorRequest<TResponse>) => Promise<Result<TResponse>>;
            on: <TEvent extends AppEvent>(event: TEvent, callback: (data: AppEventMap[TEvent]) => void) => () => void;
        };
    }
}
