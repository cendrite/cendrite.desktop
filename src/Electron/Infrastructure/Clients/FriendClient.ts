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
    private readonly profileClient: ApiClient;

    constructor(friendApiClient: ApiClient, userApiClient: ApiClient) {
        this.friendClient = friendApiClient;
        this.profileClient = userApiClient;
    }

    public sendFriendRequest(userTag: string): Promise<Result> {
        return this.friendClient.handleConduit<void>({
            method: 'POST',
            data: { friendTag: userTag },
        }, true);
    }

    public getFriendRequests(): Promise<Result<FriendRequestResponse[]>> {
        return this.friendClient.handleConduit<FriendRequestResponse[]>({
            method: 'GET',
            url: 'requests',
        });
    }

    public declineFriendRequest(userTag: string): Promise<Result> {
        return this.friendClient.handleConduit<void>({
            method: 'DELETE',
            url: 'reject',
            params: { tag: userTag },
        }, true);
    }

    public acceptFriendRequest(userTag: string): Promise<Result<AcceptFriendRequestResponse>> {
        return this.friendClient.handleConduit<AcceptFriendRequestResponse>({
            method: 'PUT',
            url: 'accept',
            data: { friendTag: userTag },
        });
    }

    public deleteFriend(userTag: string): Promise<Result> {
        return this.friendClient.handleConduit<void>({
            method: 'DELETE',
            params: { tag: userTag },
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
