
export class UpdateProfilePictureDto{
    public profilePicturePath!: string;
    private constructor() { }
    public static MapFrom(source: string): UpdateProfilePictureDto {
        const dto = new UpdateProfilePictureDto();
        dto.profilePicturePath = source;
        return dto;
    }
}