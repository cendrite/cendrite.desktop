import {User} from "../../../../Domain/Aggregates/User.js";

export class GetUserDto {
    public id!: string;
    public username!: string;
    public userTag!: string;
    public base64ProfilePicture!: string | null;
    public displayName!: string | null;

    private constructor() { }

    public static MapFrom(user: User, base64Picture: string | null): GetUserDto {
        const dto = new GetUserDto();
        dto.id = user.id;
        dto.username = user.username;
        dto.userTag = user.userTag;
        dto.base64ProfilePicture = base64Picture;
        dto.displayName = user.displayName;
        return dto;
    }
}