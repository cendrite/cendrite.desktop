import { Result } from '#shared/Result/Result';
import { RemoveGroupMemberCommand } from '#shared/Chat/RemoveGroupMember';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGroupService } from '#electron/Application/Services/GroupService';

export class RemoveGroupMemberCommandHandler implements Handler<RemoveGroupMemberCommand> {
    constructor(
        private readonly groupService: IGroupService,
        private readonly messagePump: IPump,
    ) { }

    public async handle(cmd: RemoveGroupMemberCommand): Promise<Result> {
        const removeMemberResult = await this.groupService.removeMember(cmd.groupId, cmd.userTag);
        if (removeMemberResult.success) this.messagePump.notify();

        return removeMemberResult;
    }
}
