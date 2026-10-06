import { Result } from "../../../../../Shared/Result/Result.js";
import { ISessionManager } from "../../../Contracts/Services/ISessionManager.js";
import { IMessageHubHandler } from "../../../Contracts/Services/IMessageHubHandler.js";
import { ServerMessage } from "../../../Contracts/Messaging/ServerMessage.js";
import { DeliveryStatusPayload, Envelope, PayloadType } from "../../../Contracts/Messaging/Envelope.js";
import { Handler } from "../../../Mediator/Handler.js";
import { DeliveryStatusUpdatedCommand } from "../Contracts/UpdateDeliveryStatus.js";
import { v4 as uuid } from 'uuid';

export class DeliveryStatusUpdatedCommandHandler implements Handler<DeliveryStatusUpdatedCommand> {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler) { }

    async handle(cmd: DeliveryStatusUpdatedCommand): Promise<Result<void>> {
        const meessages: ServerMessage[] = [];

        for (const conId of cmd.connectionIds) {
            const envelope = new Envelope(
                PayloadType.DeliveryStatus,
                new DeliveryStatusPayload(
                    cmd.chatId,
                    cmd.messageIds,
                    cmd.deliveryStatus,
                    cmd.participants),
            );

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
