import { Result } from '#shared/Result/Result';
import { GetGroupPrivilegeQuery } from '#shared/Chat/GetGroupPrivilege';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { IGroupKeyRepository } from '#electron/Application/Contracts/Repositories/IGroupKeyRepository';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';

export class GetGroupPrivilegeQueryHandler implements Handler<GetGroupPrivilegeQuery, ChatPrivileges> {
    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly groupKeyRepository: IGroupKeyRepository,
    ) { }

    public async handle(query: GetGroupPrivilegeQuery): Promise<Result<ChatPrivileges>> {
        const group = await this.groupRepository.get(query.groupId);
        if (group?.lifecycle !== GroupLifecycle.Active && group?.lifecycle !== GroupLifecycle.Draft) return Result.success(ChatPrivileges.None);

        const writeKey = await this.groupKeyRepository.getWriteKey(query.groupId);
        if (writeKey === null || writeKey.isInvite) return Result.success(ChatPrivileges.None);

        return Result.success(group.lifecycle === GroupLifecycle.Draft ? ChatPrivileges.Owner : group.privilege);
    }
}
