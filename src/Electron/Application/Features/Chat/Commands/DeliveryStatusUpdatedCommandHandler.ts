import { Result } from "#shared/Result/Result";
import { DeliveryStatus } from "#shared/Enums/DeliveryStatus";
import { ISessionManager, UntrustedDeviceError } from "#electron/Application/Contracts/Services/ISessionManager";
import { IMessageHubHandler, ServerMessage } from "#electron/Application/Contracts/Services/IMessageHubHandler";
import { DeliveryStatusPayload, Envelope, Payload } from "#electron/Domain/Protocol/Payload";
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
            const cipher = await this.encryptOrSkip(envelope, conId);
            if (cipher === null) continue;

            meessages.push(
                new ServerMessage(
                    uuid().toString(),
                    cmd.senderId,
                    conId,
                    cipher,
                )
            );
        }

        if (meessages.length > 0) await this.messageHubHandler.sendMessage(meessages);

        return Result.success();
    }

    private async encryptOrSkip(envelope: Envelope<Payload>, connectionId: string): Promise<string | null> {
        try {
            return await this.sessionManager.encrypt(envelope, connectionId);
        } catch (error) {
            if (error instanceof UntrustedDeviceError) return null;
            throw error;
        }
    }
}
