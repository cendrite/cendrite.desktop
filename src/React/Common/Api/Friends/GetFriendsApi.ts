import {API_URLS} from "../ApiUrls.ts";
import {ApiClient} from "../ApiClient.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface GetFriendsRequest {
    UserProfileId: string;
}

export interface GetFriendsResponse {
    username: string;
    userTag: string;
    displayName: string | null;
    profilePictureUrl: string | null;
    connectionIds: string[];
}

export class GetFriendsApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.GET_FRIENDS, true);
    }

    public async getFriends(request: GetFriendsRequest): Promise<Result<GetFriendsResponse[]>> {
        return this.client.handle<GetFriendsResponse[]>({
            params: request,
            method: "GET"
        });
    }
}
