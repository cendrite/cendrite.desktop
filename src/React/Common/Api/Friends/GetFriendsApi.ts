import {API_URLS} from "../ApiUrls.ts";
import {ApiClient} from "../ApiClient.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

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

    public async getFriends(): Promise<Result<GetFriendsResponse[]>> {
        return this.client.handleConduit<GetFriendsResponse[]>({method: "GET"});
    }
}
