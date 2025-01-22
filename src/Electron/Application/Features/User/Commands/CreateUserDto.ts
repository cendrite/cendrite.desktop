import { User } from "../../../../Persistence/Entities/User.js";

export class CreateUserDto {
    public username!: string;
    public userTag!: string;
    public profilePictureUrl?: string;
    public displayName?: string;

    private constructor() { }

    public static MapFrom(user: User): CreateUserDto {
        const dto = new CreateUserDto();
        dto.username = user.username;
        dto.userTag = user.userTag;
        dto.profilePictureUrl = user.profilePictureUrl;
        dto.displayName = user.displayName;
        return dto;
    }
}