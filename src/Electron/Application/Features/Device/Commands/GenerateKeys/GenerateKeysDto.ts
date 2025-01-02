export class GenerateKeysDto {
    privateKey!: string;
    publicKey!: string;

    private constructor() {
    }

    public static MapFrom(privateKey: string, publicKey: string): GenerateKeysDto {
        const dto = new GenerateKeysDto();
        dto.privateKey = privateKey;
        dto.publicKey = publicKey;
        return dto;
    }
}