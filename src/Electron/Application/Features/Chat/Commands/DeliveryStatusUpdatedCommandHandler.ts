import { Result } from "../../../../../Shared/Result/Result.js";
import { SessionManager } from "../../../../Infrastructure/Services/SessionManager.js";
import { MessageHubHandler } from "../../../../Infrastructure/Signal/Messaging/MessageHubHandler.js";
import { DeliveryStatusPayload, PayloadType, ServerMessage } from "../../../../Infrastructure/Signal/Messaging/ServerMessage.js";
import { Handler } from "../../../Mediator/Handler.js";
import { DeliveryStatusUpdatedCommand } from "../Contracts/UpdateDeliveryStatus.js";
import { v4 as uuid } from 'uuid';

export class DeliveryStatusUpdatedCommandHandler implements Handler<DeliveryStatusUpdatedCommand> {
    constructor(
        private readonly sessionManager: SessionManager,
        private readonly messageHubHandler: MessageHubHandler) { }

    async handle(cmd: DeliveryStatusUpdatedCommand): Promise<Result<void>> {
        const meessages: ServerMessage[] = [];

        for (const conId of cmd.connectionIds) {
            const cipher = await this.sessionManager.encrypt(
                new DeliveryStatusPayload(
                    cmd.messageIds,
                    cmd.deliveryStatus,
                    cmd.participants),
                conId
            );

            meessages.push(
                new ServerMessage(
                    uuid().toString(),
                    cmd.chatId,
                    cmd.senderId,
                    conId,
                    PayloadType.DeliveryStatus,
                    cipher,
                    new Date(),
                )
            );
        }

        await this.messageHubHandler.sendMessage(meessages);

        return Result.success();
    }
}
