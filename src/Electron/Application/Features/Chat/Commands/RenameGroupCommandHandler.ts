import { Result } from '#shared/Result/Result';
import { RenameGroupCommand } from '#shared/Chat/RenameGroup';
import { IPump } from '#electron/Application/Contracts/Services/IPump';
import { Handler } from '#electron/Application/Mediator/Handler';
import { IGroupService } from '#electron/Application/Services/GroupService';

export class RenameGroupCommandHandler implements Handler<RenameGroupCommand> {
    constructor(
        private readonly groupService: IGroupService,
        private readonly messagePump: IPump,
    ) { }

    public async handle(cmd: RenameGroupCommand): Promise<Result> {
        const renameGroupResult = await this.groupService.renameGroup(cmd.groupId, cmd.name);
        if (renameGroupResult.success) this.messagePump.notify();

        return renameGroupResult;
    }
}
