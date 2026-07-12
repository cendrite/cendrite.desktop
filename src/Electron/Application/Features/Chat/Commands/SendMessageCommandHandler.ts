import { Result } from '../../../../../Shared/Result/Result.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { Handler } from '../../../Mediator/Handler.js';
import { SendMessageCommand } from '../Contracts/SendMessage.js';

export class SendMessageCommandHandler implements Handler<SendMessageCommand, DeliveryStatus> {
    handle(request: SendMessageCommand): Promise<Result<DeliveryStatus>> {
        throw new Error('Method not implemented.');
    }
}
