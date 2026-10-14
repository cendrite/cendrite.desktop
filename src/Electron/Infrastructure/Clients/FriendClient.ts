import { Result } from '#shared/Result/Result';
import {
    AcceptFriendRequestResponse,
    FriendRequestResponse,
    FriendResponse,
    GetProfileResponse,
    IFriendProvider,
} from '#electron/Application/Contracts/Providers/IFriendProvider';
import { ApiClient } from './Base/ApiClient.js';

export class FriendClient implements IFriendProvider {
    private readonly friendClient: ApiClient;
    private readonly friendshipClient: ApiClient;
    private readonly profileClient: ApiClient;

    constructor(friendApiClient: ApiClient, friendshipApiClient: ApiClient, userApiClient: ApiClient) {
        this.friendClient = friendApiClient;
        this.friendshipClient = friendshipApiClient;
        this.profileClient = userApiClient;
    }

    public sendFriendRequest(userTag: string): Promise<Result> {
        return this.friendshipClient.handle<void>({
            method: 'POST',
            data: { friendTag: userTag },
        }, true);
    }

    public getFriendRequests(): Promise<Result<FriendRequestResponse[]>> {
        return this.friendshipClient.handle<FriendRequestResponse[]>({
            method: 'GET',
            url: 'requests',
        });
    }

    public declineFriendRequest(userTag: string): Promise<Result> {
        return this.friendshipClient.handle<void>({
            method: 'DELETE',
            url: 'reject',
            params: { friendTag: userTag },
        }, true);
    }

    public acceptFriendRequest(userTag: string): Promise<Result<AcceptFriendRequestResponse>> {
        return this.friendshipClient.handle<AcceptFriendRequestResponse>({
            method: 'PUT',
            url: 'accept',
            data: { friendTag: userTag },
        });
    }

    public deleteFriend(userTag: string): Promise<Result> {
        return this.friendshipClient.handle<void>({
            method: 'DELETE',
            url: 'delete',
            params: { friendTag: userTag },
        }, true);
    }

    public getFriends(): Promise<Result<FriendResponse[]>> {
        return this.friendClient.handleConduit<FriendResponse[]>({
            method: 'GET',
            url: 'list',
        });
    }

    public getProfile(userTag: string): Promise<Result<GetProfileResponse | void>> {
        return this.profileClient.handleConduit<GetProfileResponse>({
            method: 'GET',
            url: 'tag',
            params: { tag: userTag },
        }, true);
    }
}
