import { Result } from '#shared/Result/Result';
import { GetGroupEditableQuery } from '#shared/Chat/GetGroupEditable';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';

export class GetGroupEditableQueryHandler implements Handler<GetGroupEditableQuery, boolean> {
    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
    ) { }

    public async handle(query: GetGroupEditableQuery): Promise<Result<boolean>> {
        const group = await this.groupRepository.get(query.groupId);
        if (group?.lifecycle !== GroupLifecycle.Active && group?.lifecycle !== GroupLifecycle.Draft) return Result.success(false);
        if (group.lifecycle === GroupLifecycle.Active && group.privilege < ChatPrivileges.Admin) return Result.success(false);

        const writeKey = await this.groupKeyRepository.getWriteKey(query.groupId);

        return Result.success(writeKey !== null && !writeKey.isInvite);
    }
}
