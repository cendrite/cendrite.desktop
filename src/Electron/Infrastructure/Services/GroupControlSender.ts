import { v4 as uuid } from 'uuid';
import { IGroupControlSender } from '../../Application/Contracts/Services/IGroupControlSender.js';
import { IMessageHubHandler } from '../../Application/Contracts/Services/IMessageHubHandler.js';
import { ISessionManager } from '../../Application/Contracts/Services/ISessionManager.js';
import { Envelope, Payload, PayloadType } from '../../Application/Contracts/Messaging/Envelope.js';
import { ServerMessage } from '../../Application/Contracts/Messaging/ServerMessage.js';
import { IDeviceRepository } from '../../Application/Contracts/Repositories/IDeviceRepository.js';

/**
 * Group control traffic rides the pairwise sessions, so the server sees ordinary ciphertext and the
 * keys inside are protected by the ratchet.
 */
export class GroupControlSender implements IGroupControlSender {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly deviceRepository: IDeviceRepository,
    ) { }

    public async send(payloadType: PayloadType, payload: Payload, connectionIds: string[]): Promise<void> {
        if (connectionIds.length === 0) return;

        const device = await this.deviceRepository.get();
        if (!device) throw new Error('No local device registered');

        const messages: ServerMessage[] = [];

        for (const connectionId of connectionIds) {
            const cipher = await this.sessionManager.encrypt(new Envelope(payloadType, payload), connectionId);

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
    }
}
