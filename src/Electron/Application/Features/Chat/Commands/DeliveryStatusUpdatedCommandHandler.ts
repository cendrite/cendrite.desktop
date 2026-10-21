import { Result } from "#shared/Result/Result";
import { DeliveryStatus } from "#shared/Enums/DeliveryStatus";
import { ISessionManager } from "#electron/Application/Contracts/Services/ISessionManager";
import { IMessageHubHandler, ServerMessage } from "#electron/Application/Contracts/Services/IMessageHubHandler";
import { DeliveryStatusPayload, Envelope } from "#electron/Domain/Protocol/Payload";
import { Handler } from "#electron/Application/Mediator/Handler";
import { v4 as uuid } from 'uuid';

export class DeliveryStatusUpdatedCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
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

export class DeliveryStatusUpdatedCommandHandler implements Handler<DeliveryStatusUpdatedCommand> {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler) { }

    async handle(cmd: DeliveryStatusUpdatedCommand): Promise<Result<void>> {
        const meessages: ServerMessage[] = [];

        for (const conId of cmd.connectionIds) {
            const envelope = new Envelope(new DeliveryStatusPayload(
                cmd.chatId,
                cmd.messageIds,
                cmd.deliveryStatus,
                [cmd.senderId, conId],
            ));
            const cipher = await this.sessionManager.encrypt(envelope, conId);

            meessages.push(
                new ServerMessage(
                    uuid().toString(),
                    cmd.senderId,
                    conId,
                    cipher,
                )
            );
        }

        await this.messageHubHandler.sendMessage(meessages);

        return Result.success();
    }
}
