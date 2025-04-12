import { Result } from "../../../../Shared/Result/Result.ts";
import { ApiClient } from "../ApiClient";
import {API_URLS} from "../ApiUrls.ts";


export interface GetUserProfileResponse{
    id: string;
    username: string;
    userTag: string,
    profilePictureUrl: string | null;
    displayName: string | null;
}

export interface GetUserProfileRequest {
    userProfileId: string;
}

export class GetUserProfileApi{
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.GET_PROFILE, true);
    }

    public async getUserProfile(request: GetUserProfileRequest): Promise<Result<GetUserProfileResponse | void>> {
        return this.client.handle<GetUserProfileResponse>({
            method: "GET",
            params: request
        })
    }
}