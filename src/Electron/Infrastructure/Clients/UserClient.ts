import { Result } from "#shared/Result/Result";
import { GetUserProfileRequest, GetUserProfileResponse, IUserProvider, UpdateAvatarRequest, UpdateAvatarResponse } from "#electron/Application/Contracts/Providers/IUserProvider";
import { ApiClient } from "./Base/ApiClient.js";

export class UserClient implements IUserProvider {
    private readonly userClient: ApiClient;

    constructor(userApiClient: ApiClient) {
        this.userClient = userApiClient;
    }

    public getUserProfile(req: GetUserProfileRequest): Promise<Result<GetUserProfileResponse | void>> {
        return this.userClient.handleConduit<GetUserProfileResponse>({
            method: 'GET',
            params: req,
        });
    }

    public updateAvatar(req: UpdateAvatarRequest): Promise<Result<UpdateAvatarResponse>> {
        const formData = new FormData();
        formData.append("Avatar", new Blob([req.bytes as Uint8Array<ArrayBuffer>], { type: req.mimeType }), req.fileName);

        return this.userClient.handleConduit<UpdateAvatarResponse>({
            method: 'PUT',
            url: "avatar",
            data: formData,
            // Overrides the client's default application/json; without this axios' transformRequest
            // JSON-stringifies the FormData. Axios replaces this with the boundary-bearing header.
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    }
}
