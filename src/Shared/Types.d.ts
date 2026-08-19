import { MessageContract } from '../Electron/Application/Contracts/Models/MessageContract';
import { ChangeEvent } from '../Electron/Infrastructure/Signal/ChangeEvent/ChangeEvent.ts';
import { DeliveryStatus } from '../Electron/Domain/Enums/DeliveryStatus.ts';

declare global {
    type ConnectionState = 'connected' | 'disconnected' | 'connecting';

    type MediatorRequest = {
        type: string;
    };

    type MessageEdit =
        | { kind: 'deliveryStatus'; chatId: string; messageId: string; status: DeliveryStatus }
        | { kind: 'textEdit'; messageId: string; newText: string }
        | { kind: 'delete'; messageId: string };

    interface AppEventMap {
        changeEvent: ChangeEvent;
        message: MessageContract;
        connectionState: ConnectionState;
        messageEdit: MessageEdit;
    }
    type AppEvent = keyof AppEventMap;

    interface Window {
        electron: {
            sendRequestAsync: <TResponse>(request: MediatorRequest) => Promise<TResponse>;
            on: <TEvent extends AppEvent>(event: TEvent, callback: (data: AppEventMap[TEvent]) => void) => () => void;
        };
    }
}
