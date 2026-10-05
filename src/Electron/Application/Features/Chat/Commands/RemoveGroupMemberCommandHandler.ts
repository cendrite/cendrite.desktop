import { v4 as uuid } from 'uuid';
import { Result } from '../../../../../Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { LedgerOperationType } from '../../../../Domain/Enums/LedgerOperationType.js';
import { LedgerOperationQueuedEvent } from '../../../../Domain/Events/LedgerOperationQueuedEvent.js';
import { IEventRepository } from '../../../Contracts/Providers/IEventRepository.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { ILedgerSyncService } from '../../../Contracts/Services/ILedgerSyncService.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { RemoveGroupMemberCommand } from '../Contracts/GroupMembership.js';

export class RemoveGroupMemberCommandHandler implements Handler<RemoveGroupMemberCommand> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly userRepository: IUserRepository,
        private readonly ledgerSyncService: ILedgerSyncService,
        private readonly ledgerPump: IPump,
    ) { }

    public async handle(cmd: RemoveGroupMemberCommand): Promise<Result> {
        const synced = await this.ledgerSyncService.sync(cmd.groupId);
        if (!synced.success) return Result.fail(synced.errorMessage!);

        if (!synced.data!.state.members.has(cmd.userTag)) {
            return Result.fail(new ErrorMessage('RemoveGroupMember', `${cmd.userTag} is not in the group`));
        }

        const user = await this.userRepository.get(true);

        await this.eventRepository.appendEvent(
            new LedgerOperationQueuedEvent(
                uuid().toString(),
                cmd.groupId,
                {
                    type: LedgerOperationType.MemberRemoved,
                    authorTag: user.userTag,
                    at: Date.now(),
                    userTag: cmd.userTag,
                },
                false,
                new Date(),
            ),
        );

        this.ledgerPump.notify();

        return Result.success();
    }
}
