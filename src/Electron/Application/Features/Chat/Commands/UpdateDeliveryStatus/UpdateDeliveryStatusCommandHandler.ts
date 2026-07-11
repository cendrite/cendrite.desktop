import { Result } from '../../../../../../Shared/Result/Result.js';
import { ChatStore } from '../../../../../Infrastructure/Persistence/Repositories/ChatStore.js';
import { Handler } from '../../../../Mediator/Handler.js';
import { UpdateDeliveryStatusCommand } from './UpdateDeliveryStatusCommand.js';

export class UpdateDeliveryStatusCommandHandler implements Handler<UpdateDeliveryStatusCommand> {
    public async handle(request: UpdateDeliveryStatusCommand): Promise<Result> {
        const chatStore = new ChatStore();
        await chatStore.updateDeliveryStatus(request.chatId, request.messageIds, request.deliveryStatus);
        return Result.success();
    }
}
