import { Result } from '#shared/Result/Result';
import { LeaveGroupCommand } from '#shared/Groups/LeaveGroup';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGroupService } from '#electron/Application/Services/Group/GroupService';

export class LeaveGroupCommandHandler implements Handler<LeaveGroupCommand> {
    constructor(
        private readonly groupService: IGroupService,
        private readonly messagePump: IPump,
    ) { }

    public async handle(cmd: LeaveGroupCommand): Promise<Result> {
        const leaveGroupResult = await this.groupService.leaveGroup(cmd.groupId);
        if (leaveGroupResult.success) this.messagePump.notify();

        return leaveGroupResult;
    }
}
