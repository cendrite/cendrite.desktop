import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";


export interface GetUserProfileByTagRequest {
    id: string;
    tag: string;
}

export interface GetUserProfileByTagResponse {
    username: string;
    userTag: string;
    displayName?: string;
    profilePictureUrl?: string;
}

export class GetUserProfileByTagApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.GET_BY_TAG, true);
    }

    public async getUserProfileByTag(request: GetUserProfileByTagRequest): Promise<Result<GetUserProfileByTagResponse | void>> {
        return this.client.handle<GetUserProfileByTagResponse>({
            method: "GET",
            params: request
        }, true);
    }
}