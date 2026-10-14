import { DeliveryStatus } from "../../../../../Shared/Contracts/Enums/DeliveryStatus.js";

export class DeliveryStatusUpdatedCommand implements MediatorRequest {
    type = DeliveryStatusUpdatedCommand.name;
    constructor(
        public readonly senderId: string,
        public readonly chatId: string,
        public readonly messageIds: string[],
        public readonly connectionIds: string[],
        public readonly participants: string[],
        public readonly deliveryStatus: DeliveryStatus,
    ) { }
}
