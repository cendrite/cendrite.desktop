import { DeliveryStatus } from '../../../../Shared/Contracts/Enums/DeliveryStatus.js';
import { ServerMessage } from '../Messaging/ServerMessage.js';

export interface IMessageHubHandler {
    sendMessage(messages: ServerMessage[]): Promise<DeliveryStatus>;
}
