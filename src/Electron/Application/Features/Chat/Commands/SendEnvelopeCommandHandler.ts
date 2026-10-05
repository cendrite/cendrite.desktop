import { v4 as uuid } from 'uuid';
import { Result } from '../../../../../Shared/Result/Result.js';
import { Envelope, Payload } from '../../../Contracts/Messaging/Envelope.js';
import { ServerMessage } from '../../../Contracts/Messaging/ServerMessage.js';
import { IDeviceRepository } from '../../../Contracts/Repositories/IDeviceRepository.js';
import { IMessageHubHandler } from '../../../Contracts/Services/IMessageHubHandler.js';
import { ISessionManager } from '../../../Contracts/Services/ISessionManager.js';
import { Handler } from '../../../Mediator/Handler.js';
import { SendEnvelopeCommand } from '../Contracts/SendEnvelope.js';

/** Sends an envelope that is not a chat message, over the same pairwise sessions and the same hub. */
export class SendEnvelopeCommandHandler implements Handler<SendEnvelopeCommand, void> {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly deviceRepository: IDeviceRepository,
    ) { }

    public async handle(cmd: SendEnvelopeCommand): Promise<Result> {
        if (cmd.connectionIds.length === 0) return Result.success();

        const device = await this.deviceRepository.get();
        if (!device) throw new Error('No local device registered');

        const messages: ServerMessage[] = [];

        for (const connectionId of cmd.connectionIds) {
            const cipher = await this.sessionManager.encrypt(
                new Envelope(cmd.payloadType, cmd.payload as Payload),
                connectionId,
            );

            messages.push(
                new ServerMessage(
                    uuid().toString(),
                    null,
                    device.connectionId,
                    connectionId,
                    cipher,
                    new Date(),
                    null,
                ),
            );
        }

        await this.messageHubHandler.sendMessage(messages);

        return Result.success();
    }
}
