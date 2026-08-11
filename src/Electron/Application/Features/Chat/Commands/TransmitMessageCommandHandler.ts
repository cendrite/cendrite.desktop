import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { DeliveryStatus } from '../../../../Domain/Enums/DeliveryStatus.js';
import { SessionManager } from '../../../../Infrastructure/Services/SessionManager.js';
import { MessageHubHandler } from '../../../../Infrastructure/Signal/Messaging/MessageHubHandler.js';
import { MediaContract } from '../../../Contracts/Models/MediaContract.js';
import { IMediaStore } from '../../../Contracts/Repositories/IMediaStore.js';
import { Handler } from '../../../Mediator/Handler.js';
import { IMediaService } from '../../../Services/Media/MediaService.js';
import { TransmitMessageCommand } from '../Contracts/TransmitMessage.js';

export class TransmitMessageCommandHandler implements Handler<TransmitMessageCommand, DeliveryStatus> {
    constructor(
        private readonly sessionManager: SessionManager,
        private readonly messageHubHandler: MessageHubHandler,
        private readonly mediaService: IMediaService,
        private readonly mediaStore: IMediaStore,
    ) { }

    async handle(cmd: TransmitMessageCommand): Promise<Result<DeliveryStatus>> {

        const m_contracts: MediaContract[] = [];
        for(const m of cmd.message.messageMedia?? []) {
            const mediaContent = await this.mediaStore.get(m.id);
            if(!mediaContent) {
                return Result.fail<DeliveryStatus>(new ErrorMessage(null, `Media content not found for media id: ${m.id}`));
            }
            m_contracts.push(new MediaContract(m.id, m.type, mediaContent));
        }

        return Result.success(DeliveryStatus.Delivered);
    }
}
