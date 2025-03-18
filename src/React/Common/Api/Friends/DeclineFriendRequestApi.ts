import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface DeleteFriendshipRequest {
    Id: string;
    friendTag: string;
}

export class DeclineFriendRequestApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.DELETE_FRIEND_REQUEST, true);
    }

    public async declineFriendRequest(request: DeleteFriendshipRequest): Promise<Result> {
        console.log("Decline friend request");
        return this.client.handle({
            method: "DELETE",
            params: request
        }, true);
    }
}