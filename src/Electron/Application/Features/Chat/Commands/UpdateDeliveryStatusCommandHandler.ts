import { Result } from '../../../../../Shared/Result/Result.js';
import { DeliveryStatusUpdatedEvent } from '../../../../Domain/Events/DeliveryStatusUpdatedEvent.js';
import { IEventRepository } from '../../../Contracts/Providers/IEventRepository.js';
import { IChatStore } from '../../../Contracts/Repositories/IChatStore.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { UpdateDeliveryStatusCommand } from '../Contracts/UpdateDeliveryStatus.js';
import { v4 as uuid } from 'uuid';

export class UpdateDeliveryStatusCommandHandler implements Handler<UpdateDeliveryStatusCommand> {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly eventRepository: IEventRepository,
        private readonly deliveryStatusUpdatePump: IPump,
    ) { }

    public async handle(cmd: UpdateDeliveryStatusCommand): Promise<Result> {
        await this.chatStore.updateDeliveryStatus(cmd.chatId, cmd.messageIds, cmd.deliveryStatus);

        await this.eventRepository.appendEvent(new DeliveryStatusUpdatedEvent(
            uuid().toString(),
            cmd.senderId,
            new Date(),
            cmd.chatId,
            cmd.messageIds,
            cmd.deliveryStatus,
            cmd.participants,
            cmd.connectionIds)
        );

        this.deliveryStatusUpdatePump.notify();

        return Result.success();
    }
}
