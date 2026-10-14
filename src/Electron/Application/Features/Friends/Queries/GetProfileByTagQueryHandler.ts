import { Result } from '#shared/Result/Result';
import { IFriendProvider } from '#electron/Application/Contracts/Providers/IFriendProvider';
import { Handler } from '#electron/Application/Mediator/Handler';
import { GetProfileByTagQuery, ProfileDto } from '#shared/Friends/GetProfileByTag';

export class GetProfileByTagQueryHandler implements Handler<GetProfileByTagQuery, ProfileDto | void> {
    constructor(private readonly friendProvider: IFriendProvider) { }

    public async handle(query: GetProfileByTagQuery): Promise<Result<ProfileDto | void>> {
        const result = await this.friendProvider.getProfile(query.tag);

        if (!result.success) return Result.fail<ProfileDto>(result.errorMessage);

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
