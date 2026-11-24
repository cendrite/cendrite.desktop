import { Result } from '#shared/Result/Result';
import { ChangeMemberPrivilegeCommand } from '#shared/Groups/ChangeMemberPrivilege';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGroupService } from '#electron/Application/Services/Group/GroupService';

export class ChangeMemberPrivilegeCommandHandler implements Handler<ChangeMemberPrivilegeCommand> {
    constructor(
        private readonly groupService: IGroupService,
        private readonly messagePump: IPump,
    ) { }

    public async handle(cmd: ChangeMemberPrivilegeCommand): Promise<Result> {
        const changePrivilegeResult = await this.groupService.changeMemberPrivilege(cmd.groupId, cmd.userTag, cmd.privilege);
        if (changePrivilegeResult.success) this.messagePump.notify();

        return changePrivilegeResult;
    }
}
