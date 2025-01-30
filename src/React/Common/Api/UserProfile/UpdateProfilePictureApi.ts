import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface UpdateProfilePictureApiRequest {
    Id: string;
    NewProfilePicture: string;
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
        formData.append("Id", request.Id);
        const file = this.base64ToFile(request.NewProfilePicture, "profilePicture.png");
        formData.append("NewProfilePicture", file);

        return this.client.handle<UpdateProfilePictureApiResponse>({
            method: "PUT",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
    }

    private base64ToFile(base64Data: string, fileName: string): File {

        const matches = base64Data.match(/^data:(.+);base64,(.*)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 format');
        }

        const mimeType = matches[1];
        const byteCharacters = atob(matches[2]);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new File([byteArray], fileName, { type: mimeType });
    }
}