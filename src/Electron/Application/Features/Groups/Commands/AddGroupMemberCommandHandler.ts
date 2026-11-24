import { Result } from '#shared/Result/Result';
import { AddGroupMemberCommand } from '#shared/Groups/AddGroupMember';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGroupService } from '#electron/Application/Services/Group/GroupService';

export class AddGroupMemberCommandHandler implements Handler<AddGroupMemberCommand> {
    constructor(
        private readonly groupService: IGroupService,
        private readonly messagePump: IPump,
    ) { }

    public async handle(cmd: AddGroupMemberCommand): Promise<Result> {
        const addMemberResult = await this.groupService.addMember(cmd.groupId, cmd.friendId);
        if (addMemberResult.success) this.messagePump.notify();

        return addMemberResult;
    }
}
