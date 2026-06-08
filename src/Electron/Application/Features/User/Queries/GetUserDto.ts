import {User} from "../../../../Domain/Aggregates/User.js";

export class GetUserDto {
    public id!: string;
    public username!: string;
    public userTag!: string;
    public avatarKey!: string | null;
    public displayName!: string | null;
    public externalConnectionIds!: string[];

    private constructor() { }

    public static MapFrom(user: User): GetUserDto {
        const dto = new GetUserDto();
        dto.id = user.id;
        dto.username = user.username;
        dto.userTag = user.userTag;
        dto.avatarKey = user.avatarKey;
        dto.displayName = user.displayName;
        dto.externalConnectionIds = user.connectionIds.map(conn => conn.connectionId);
        return dto;
    }
}
