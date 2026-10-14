import { Result } from '#shared/Result/Result';
import { IFriendProvider } from '#electron/Application/Contracts/Providers/IFriendProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { FriendRequestDto, GetFriendRequestsQuery } from '#shared/Friends/GetFriendRequests';

export class GetFriendRequestsQueryHandler implements Handler<GetFriendRequestsQuery, FriendRequestDto[]> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public async handle(_query: GetFriendRequestsQuery): Promise<Result<FriendRequestDto[]>> {
        const result = await this.friendProvider.getFriendRequests();

        if (result.success === false || !result.data) return Result.success<FriendRequestDto[]>([]);

        return Result.success(result.data);
    }
}
