import {User} from "../../../../../Persistence/Entities/User.js";

export class CreateUserDto {
    public id!: string;
    public username!: string;
    public userTag!: string;
    public base64ProfilePicture?: string;
    public displayName?: string;

    private constructor() { }

    public static MapFrom(user: User, base64ProfilePicture?: string): CreateUserDto {
        const dto = new CreateUserDto();
        dto.id = user.id;
        dto.username = user.username;
        dto.userTag = user.userTag;
        dto.base64ProfilePicture = base64ProfilePicture;
        dto.displayName = user.displayName;
        return dto;
    }
}