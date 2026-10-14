import { ErrorMessage } from '../../../../../Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../Shared/Result/Result.js';
import { IFriendProvider } from '../../../Contracts/Providers/IFriendProvider.js';
import { Handler } from '../../../Mediator/Handler.js';
import { GetProfileByTagQuery, ProfileDto } from '../../../../../Shared/Contracts/Friends/GetProfileByTag.js';

export class GetProfileByTagQueryHandler implements Handler<GetProfileByTagQuery, ProfileDto | void> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public async handle(query: GetProfileByTagQuery): Promise<Result<ProfileDto | void>> {
        const result = await this.friendProvider.getProfile(query.tag);

        if (result.success === false) return Result.fail<ProfileDto>(new ErrorMessage(null, 'Failed to load profile'));

        // No user carries that tag.
        if (!result.data) return Result.success();

        return Result.success<ProfileDto>({
            username: result.data.username,
            userTag: result.data.userTag,
            displayName: result.data.displayName,
            avatarKey: result.data.avatarKey,
            friendshipStatus: result.data.friendshipStatus?.status,
            friendshipDirection: result.data.friendshipStatus?.direction,
        });
    }
}
