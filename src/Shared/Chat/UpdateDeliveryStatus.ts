import { DeliveryStatus } from "../Enums/DeliveryStatus.js";

export class UpdateDeliveryStatusCommand implements MediatorRequest {
    type = UpdateDeliveryStatusCommand.name;
    constructor(
        public readonly chatId: string,
        public readonly senderId: string,
        public readonly messageIds: string[],
        public readonly connectionIds: string[],
        public readonly participants: string[],
        public readonly deliveryStatus: DeliveryStatus,
    ) { }
}
