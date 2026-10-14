import { Result } from '#shared/Result/Result';
import { DeliveryStatusUpdatedEvent } from '#electron/Domain/Events/DeliveryStatusUpdatedEvent';
import { IEventRepository } from '#electron/Application/Contracts/Providers/IEventRepository';
import { IChatStore } from '#electron/Application/Contracts/Repositories/IChatStore';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { UpdateDeliveryStatusCommand } from '#shared/Chat/UpdateDeliveryStatus';
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
