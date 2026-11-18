import { Result } from '#shared/Result/Result';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { Handler } from '#electron/Application/Mediator/Handler';
import { GetTamperedGroupsQuery } from '#shared/Chat/GetTamperedGroups';

export class GetTamperedGroupsQueryHandler implements Handler<GetTamperedGroupsQuery, string[]> {
    constructor(private readonly groupRepository: IGroupRepository) { }

    public async handle(_query: GetTamperedGroupsQuery): Promise<Result<string[]>> {
        return Result.success(await this.groupRepository.getTamperedIds());
    }
}
