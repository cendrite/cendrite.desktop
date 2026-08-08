import { Result } from "../../../../../Shared/Result/Result.js";
import { IChatStore } from "../../../Contracts/Repositories/IChatStore.js";
import { Handler } from "../../../Mediator/Handler.js";
import { UpdateDeliveryStatusCommand } from "../Contracts/UpdateDeliveryStatus.js";

export class UpdateDeliveryStatusCommandHandler implements Handler<UpdateDeliveryStatusCommand> {
    constructor(private readonly chatStore: IChatStore) { }

    public async handle(request: UpdateDeliveryStatusCommand): Promise<Result> {
        await this.chatStore.updateDeliveryStatus(request.chatId, request.messageIds, request.deliveryStatus);
        return Result.success();
    }
}
