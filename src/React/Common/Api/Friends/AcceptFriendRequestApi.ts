import {Result} from "../../../../Shared/Result/Result";
import {ApiClient} from "../ApiClient";
import {API_URLS} from "../ApiUrls";

export interface AcceptFriendshipRequest {
    friendTag: string;
}

export interface AcceptFriendshipDto {
    username: string;
    tag: string;
    displayName: string | null;
    profilePictureUrl?: string;
    connectionIds: string[];
}

export class AcceptFriendshipApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.ACCEPT_FRIENDSHIP, true);
    }

    public async acceptFriendship(request: AcceptFriendshipRequest): Promise<Result<AcceptFriendshipDto>> {
        return this.client.handle({
            method: "PUT",
            data: request
        });
    }
}
