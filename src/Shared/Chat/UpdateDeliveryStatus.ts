import { DeliveryStatus } from "../Enums/DeliveryStatus.js";

export class UpdateDeliveryStatusCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
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
