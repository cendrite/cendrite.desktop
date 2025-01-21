import { RefreshToken } from "../../../../Persistence/Entities/RefreshToken.js";

export class GetRefreshTokenDto {
    refreshToken!: string;
    expiresAt!: Date;

    private constructor() {
    }

    public static MapFrom(token: RefreshToken): GetRefreshTokenDto {
        const dto = new GetRefreshTokenDto();
        dto.refreshToken = token.token;
        dto.expiresAt = token.expiresAt;
        return dto;
    }
}