import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface GetUserProfilePictureRequest {
    profilePictureUrl: string;
}

export interface GetUserProfilePictureResponse {
    base64ProfilePicture: string;
}

export class GetUserProfilePictureApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.GET_PROFILE_PICTURE, true);
    }

    public async getUserProfilePicture(request: GetUserProfilePictureRequest): Promise<Result<GetUserProfilePictureResponse | void>> {
        return this.client.handle<GetUserProfilePictureResponse>({
            method: "GET",
            params: request
        });
    }
}