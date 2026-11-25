import { Result } from '#shared/Result/Result';
import { DeleteGroupCommand } from '#shared/Groups/DeleteGroup';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGroupService } from '#electron/Application/Services/Group/GroupService';

export class DeleteGroupCommandHandler implements Handler<DeleteGroupCommand> {
    constructor(
        private readonly groupService: IGroupService,
        private readonly messagePump: IPump,
    ) { }

    public async handle(cmd: DeleteGroupCommand): Promise<Result> {
        const closeGroupResult = await this.groupService.closeGroup(cmd.groupId);
        if (closeGroupResult.success) this.messagePump.notify();

        return closeGroupResult;
    }
}
