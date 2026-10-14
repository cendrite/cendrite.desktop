import { Result } from '../../../../../Shared/Result/Result.js';
import { DeliveryStatus } from '../../../../../Shared/Enums/DeliveryStatus.js';
import { MessageContract } from '../../../../../Shared/Models/MessageContract.js';
import { ISessionManager } from '../../../Contracts/Services/ISessionManager.js';
import { IMessageHubHandler, ServerMessage } from '../../../Contracts/Services/IMessageHubHandler.js';
import { Envelope, MessagePayload, Payload } from '../../../../Domain/Protocol/Payload.js';
import { Handler } from '../../../Mediator/Handler.js';
import { IMediaService } from '../../../Services/Media/MediaService.js';

export class MessageSentCommand implements MediatorRequest<DeliveryStatus> {
    declare readonly _response?: DeliveryStatus;
    type = MessageSentCommand.name;
    public readonly message: MessageContract;
    public readonly connectionIds: string[];
    public readonly participants: string[];
    public readonly payloads: Record<string, Payload[]>;

    public constructor(
        message: MessageContract,
        connectionIds: string[],
        participants: string[],
        payloads: Record<string, Payload[]>,
    ) {
        this.message = message;
        this.connectionIds = connectionIds;
        this.participants = participants;
        this.payloads = payloads;
    }
}

export class MessageSentCommandHandler implements Handler<MessageSentCommand, DeliveryStatus> {
    constructor(
        private readonly sessionManager: ISessionManager,
        private readonly messageHubHandler: IMessageHubHandler,
        private readonly mediaService: IMediaService,
    ) { }

    async handle(cmd: MessageSentCommand): Promise<Result<DeliveryStatus>> {
        if (!cmd.message.messageToken) {
            throw new Error('Cannot send chat message without a token');
        }

        const m_pointers = await this.mediaService.upload(cmd.message.media);

        const messages: ServerMessage[] = [];

        for (const conId of cmd.connectionIds) {
            const envelope = new Envelope([
                ...(cmd.payloads[conId] ?? []),
                new MessagePayload(
                    cmd.message.chatId,
                    cmd.message.text,
                    m_pointers,
                    cmd.participants,
                    cmd.message.deliveryStatus,
                ),
            ]);

            console.log("payload count for connection", conId, envelope.payloads.length);


            const cipher = await this.sessionManager.encrypt(envelope, conId);

            messages.push(
                new ServerMessage(
                    cmd.message.id,
                    cmd.message.senderId,
                    conId,
                    cipher,
                    cmd.message.date,
                    cmd.message.messageToken,
                ),
            );
        }

        const receipt = await this.messageHubHandler.sendMessage(messages);

        return Result.success(receipt);
    }
}
