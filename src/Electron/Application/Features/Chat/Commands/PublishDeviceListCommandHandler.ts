import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { Result } from '../../../../../Shared/Result/Result.js';
import { GroupLifecycle } from '../../../../Domain/Enums/GroupLifecycle.js';
import { LedgerOperationType } from '../../../../Domain/Enums/LedgerOperationType.js';
import { LedgerOperationQueuedEvent } from '../../../../Domain/Events/LedgerOperationQueuedEvent.js';
import { IEventRepository } from '../../../Contracts/Providers/IEventRepository.js';
import { IGroupRepository } from '../../../Contracts/Repositories/IGroupRepository.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { PublishDeviceListCommand } from '../Contracts/GroupMembership.js';

/**
 * Every member publishes their own devices, so nobody has to look another member up and the list is
 * only ever as stale as that member's last connection.
 */
export class PublishDeviceListCommandHandler implements Handler<PublishDeviceListCommand> {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly groupRepository: IGroupRepository,
        private readonly userRepository: IUserRepository,
        private readonly ledgerPump: IPump,
    ) { }

    public async handle(cmd: PublishDeviceListCommand): Promise<Result> {
        const user = await this.userRepository.get(true);
        const connectionIds = (user.connectionIds ?? []).map((device) => device.connectionId).sort();
        const fingerprint = createHash('sha256').update(connectionIds.join(',')).digest('base64');

        const groups = cmd.groupId
            ? [await this.groupRepository.get(cmd.groupId)].filter((group) => group !== null)
            : await this.groupRepository.getByLifecycle(GroupLifecycle.Active);

        let queued = 0;

        for (const group of groups) {
            if (group.publishedDevicesHash === fingerprint) continue;

            await this.eventRepository.appendEvent(
                new LedgerOperationQueuedEvent(
                    uuid().toString(),
                    group.groupId,
                    {
                        type: LedgerOperationType.DeviceListPublished,
                        authorTag: user.userTag,
                        at: Date.now(),
                        userTag: user.userTag,
                        connectionIds,
                    },
                    false,
                    new Date(),
                ),
            );

            group.publishedDevicesHash = fingerprint;
            await this.groupRepository.save(group);
            queued++;
        }

        if (queued > 0) this.ledgerPump.notify();

        return Result.success();
    }
}
