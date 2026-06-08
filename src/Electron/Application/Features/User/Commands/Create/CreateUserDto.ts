import {User} from "../../../../../Domain/Aggregates/User.js";

export class CreateUserDto {
    public id!: string;
    public username!: string;
    public userTag!: string;
    public avatarKey!: string | null;
    public displayName!: string | null;
    public connectionIds!: string[];

    private constructor() { }

    public static MapFrom(user: User, base64ProfilePicture: string | null): CreateUserDto {
        const dto = new CreateUserDto();
        dto.id = user.id;
        dto.username = user.username;
        dto.userTag = user.userTag;
        dto.avatarKey = base64ProfilePicture;
        dto.displayName = user.displayName;
        dto.connectionIds = user.connectionIds.map(conn => conn.connectionId);
        return dto;
    }
}
