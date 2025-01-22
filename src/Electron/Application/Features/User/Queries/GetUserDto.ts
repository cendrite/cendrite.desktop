import {User} from "../../../../Persistence/Entities/User.js";

export class GetUserDto {
    public id!: string;
    public username!: string;
    public userTag!: string;
    public profilePictureUrl?: string;
    public displayName?: string;

    private constructor() { }

    public static MapFrom(user: User): GetUserDto {
        const dto = new GetUserDto();
        dto.id = user.id;
        dto.username = user.username;
        dto.userTag = user.userTag;
        dto.profilePictureUrl = user.profilePictureUrl;
        dto.displayName = user.displayName;
        return dto;
    }
}