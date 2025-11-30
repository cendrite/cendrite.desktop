import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";
import { FriendshipStatus } from "../../../Enums/FriendshipStatus.ts";
import {FriendshipDirection} from "../../../Enums/FriendshipDirection.ts";


export interface GetUserProfileByTagRequest {
    tag: string;
}

export interface GetUserProfileByTagResponse {
    username: string;
    userTag: string;
    displayName: string | null;
    profilePictureUrl: string | null;
    friendshipStatus: FriendshipStatusDto;
}

export class FriendshipStatusDto {
    status?: FriendshipStatus;
    direction!: FriendshipDirection;
}

export class GetUserProfileByTagApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.GET_BY_TAG, true);
    }

    public async getUserProfileByTag(request: GetUserProfileByTagRequest): Promise<Result<GetUserProfileByTagResponse | void>> {
        return this.client.handleConduit<GetUserProfileByTagResponse>({
            method: "GET",
            params: request
        }, true);
    }
}
