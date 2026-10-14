import { Result } from "../../../../../Shared/Result/Result.js";
import { DeliveryStatus } from "../../../../../Shared/Enums/DeliveryStatus.js";
import { ISessionManager } from "../../../Contracts/Services/ISessionManager.js";
import { IMessageHubHandler, ServerMessage } from "../../../Contracts/Services/IMessageHubHandler.js";
import { DeliveryStatusPayload, Envelope } from "../../../../Domain/Protocol/Payload.js";
import { Handler } from "../../../Mediator/Handler.js";
import { v4 as uuid } from 'uuid';

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
                    new Date(),
                )
            );
        }

        await this.messageHubHandler.sendMessage(meessages);

        return Result.success();
    }
}
