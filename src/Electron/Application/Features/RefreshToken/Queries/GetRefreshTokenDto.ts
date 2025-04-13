import { RefreshToken } from "../../../../Domain/Entities/RefreshToken.js";

export class GetRefreshTokenDto {
    refreshToken!: string;
    expiresAt!: Date;

    private constructor() {
    }

    public static MapFrom(token: RefreshToken): GetRefreshTokenDto {
        const dto = new GetRefreshTokenDto();
        dto.refreshToken = token.token;
        dto.expiresAt = new Date(token.expiresAt);
        return dto;
    }
}