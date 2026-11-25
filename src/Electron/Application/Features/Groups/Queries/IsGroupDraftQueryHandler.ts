import { Result } from '#shared/Result/Result';
import { IsGroupDraftQuery } from '#shared/Groups/IsGroupDraft';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';

export class IsGroupDraftQueryHandler implements Handler<IsGroupDraftQuery, boolean> {
    constructor(private readonly groupRepository: IGroupRepository) { }

    public async handle(query: IsGroupDraftQuery): Promise<Result<boolean>> {
        const group = await this.groupRepository.get(query.groupId);

        return Result.success(group?.lifecycle === GroupLifecycle.Draft);
    }
}
