import { Result } from '../../../../Shared/Result/Result.js';

export interface GetUserProfileResponse {
    id: string;
    username: string;
    userTag: string;
    avatarKey: string | null;
    displayName: string | null;
    connectionIds: string[];
}

export interface GetUserProfileRequest {
    exclusiveConnectionId: string;
}

export interface UpdateAvatarRequest {
    bytes: Uint8Array;
    mimeType: string;
    fileName: string;
}

export interface UpdateAvatarResponse {
    fileKey: string;
}

export interface IUserProvider {
    getUserProfile(req: GetUserProfileRequest): Promise<Result<GetUserProfileResponse | void>>;
    updateAvatar(req: UpdateAvatarRequest): Promise<Result<UpdateAvatarResponse>>;
}
