import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface DeleteFriendRequest{
    friendTag: string;
}

export class DeleteFriendApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.DELETE_FRIENDSHIP, true);
    }

    public async deleteFriend(request: DeleteFriendRequest): Promise<Result> {
        return this.client.handle({
            method: "DELETE",
            params: request
        });
    }
}