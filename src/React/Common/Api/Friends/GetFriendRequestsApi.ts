import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface GetFriendRequestResponse {
    userTag: string;
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
    isSeen: boolean;
}


export class GetFriendRequestsApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.GET_FRIEND_REQUESTS, true);
    }

    public async getFriendRequests(): Promise<Result<GetFriendRequestResponse[]>> {
        return this.client.handle({
            method: "GET",
        });
    }
}
