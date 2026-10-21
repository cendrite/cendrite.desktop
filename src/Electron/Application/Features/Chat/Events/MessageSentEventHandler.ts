import { Result } from '#shared/Result/Result';
import { DeliveryStatus } from '#shared/Enums/DeliveryStatus';
import { MessageContract } from '#shared/Models/MessageContract';
import { ISessionManager } from '#electron/Application/Contracts/Services/ISessionManager';
import { IMessageHubHandler, ServerMessage } from '#electron/Application/Contracts/Services/IMessageHubHandler';
import { Envelope, MessagePayload, Payload } from '#electron/Domain/Protocol/Payload';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IMediaService } from '#electron/Application/Services/Media/MediaService';
import { v4 as uuid } from 'uuid';

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
                    cmd.message.id,
                    cmd.message.chatId,
                    cmd.message.text,
                    m_pointers,
                    cmd.participants,
                    cmd.message.deliveryStatus,
                    cmd.message.messageToken,
                    cmd.message.date,
                ),
            ]);

            console.log('payload count for connection', conId, envelope.payloads.length);

            const cipher = await this.sessionManager.encrypt(envelope, conId);

            messages.push(new ServerMessage(uuid().toString(), cmd.message.senderId, conId, cipher));
        }

        const receipt = await this.messageHubHandler.sendMessage(messages);

        return Result.success(receipt);
    }
}
