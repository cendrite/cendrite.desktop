import { Result } from "../../../../Shared/Result/Result.ts";
import { ApiClient } from "../ApiClient";
import {API_URLS} from "../ApiUrls.ts";


export interface GetUserProfileResponse{
    id: string;
    username: string;
    userTag: string,
    profilePictureUrl: string | null;
    displayName: string | null;
    connectionIds: string[];
}

export interface GetUserProfileRequest{
    exclusiveConnectionId: string;
}

export class GetUserProfileApi{
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.GET_PROFILE, true);
    }

    public async getUserProfile(req: GetUserProfileRequest): Promise<Result<GetUserProfileResponse | void>> {
        return this.client.handleConduit<GetUserProfileResponse>({
            method: "GET",
            params: req
        })
    }
}
