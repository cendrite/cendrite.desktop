import { Result } from '#shared/Result/Result';
import { AddGroupMemberCommand } from '#shared/Chat/AddGroupMember';
import { IGroupMemberService } from '#electron/Application/Contracts/Services/IGroupMemberService';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';

export class AddGroupMemberCommandHandler implements Handler<AddGroupMemberCommand> {
    constructor(
        private readonly groupMemberService: IGroupMemberService,
        private readonly writeKeySwapPump: IPump,
    ) { }

    public async handle(cmd: AddGroupMemberCommand): Promise<Result> {
        const addMemberResult = await this.groupMemberService.addMember(cmd.groupId, cmd.friendId);
        if (addMemberResult.success) this.writeKeySwapPump.notify();

        return addMemberResult;
    }
}
