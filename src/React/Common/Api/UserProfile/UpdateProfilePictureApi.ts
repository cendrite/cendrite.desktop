import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface UpdateProfilePictureApiRequest {
    ProfilePicture: File;
}

export interface UpdateProfilePictureApiResponse {
    ProfilePictureUrl: string;
}

export class UpdateProfilePictureApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.UPDATE_PROFILE_PICTURE, true);
    }

    public async updateProfilePicture(request: UpdateProfilePictureApiRequest): Promise<Result<UpdateProfilePictureApiResponse>> {

        const formData = new FormData();
        formData.append("ProfilePicture", request.ProfilePicture);

        return this.client.handle<UpdateProfilePictureApiResponse>({
            method: "PUT",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
    }
}