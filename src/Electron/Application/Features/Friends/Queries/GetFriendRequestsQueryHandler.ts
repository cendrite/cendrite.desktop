import { Result } from '../../../../../Shared/Result/Result.js';
import { IFriendProvider } from '../../../Contracts/Providers/IFriendProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { FriendRequestDto, GetFriendRequestsQuery } from '../../../../../Shared/Contracts/Friends/GetFriendRequests.js';

export class GetFriendRequestsQueryHandler implements Handler<GetFriendRequestsQuery, FriendRequestDto[]> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public async handle(_query: GetFriendRequestsQuery): Promise<Result<FriendRequestDto[]>> {
        const result = await this.friendProvider.getFriendRequests();

        if (result.success === false || !result.data) return Result.success<FriendRequestDto[]>([]);

        return Result.success(result.data);
    }
}
