import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface UpdateAvatarApiRequest {
    Avatar: File;
}

export interface UpdateAvatarApiResponse {
    fileKey: string;
}

export class UpdateAvatarApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.UPDATE_AVATAR, true);
    }

    public async handle(req: UpdateAvatarApiRequest): Promise<Result<UpdateAvatarApiResponse>> {

        const formData = new FormData();
        formData.append("Avatar", req.Avatar);

        return this.client.handleConduit<UpdateAvatarApiResponse>({
            method: "PUT",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
    }
}
