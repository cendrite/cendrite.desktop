import { Result } from '#shared/Result/Result';
import { GetMembershipWarningQuery } from '#shared/Groups/GetMembershipWarning';
import { MembershipWarning } from '#shared/Enums/MembershipWarning';
import { IGroupRepository } from '#electron/Application/Contracts/Repositories/IGroupRepository';
import { Handler } from '#electron/Application/Mediator/Handler';

export class GetMembershipWarningQueryHandler implements Handler<GetMembershipWarningQuery, MembershipWarning | null> {
    constructor(private readonly groupRepository: IGroupRepository) { }

    public async handle(query: GetMembershipWarningQuery): Promise<Result<MembershipWarning | null>> {
        const group = await this.groupRepository.get(query.groupId);

        return Result.success(group?.membershipWarning ?? null);
    }
}
