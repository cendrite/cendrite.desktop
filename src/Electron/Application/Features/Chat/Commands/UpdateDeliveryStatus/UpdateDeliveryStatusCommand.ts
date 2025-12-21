import { DeliveryStatus } from "../../../../../Domain/Enums/DeliveryStatus.js";

export class UpdateDeliveryStatusCommand implements MediatorRequest {
    type = UpdateDeliveryStatusCommand.name;
    constructor(
        public readonly chatId: string,
        public readonly messageIds: string[],
        public readonly deliveryStatus: DeliveryStatus,
    ) { }
}
