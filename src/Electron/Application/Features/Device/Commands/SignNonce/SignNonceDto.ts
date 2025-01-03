export class SignNonceDto {
    signature!: string;

    private constructor() {
    }

    public static MapFrom(signature: string): SignNonceDto {
        const dto = new SignNonceDto();
        dto.signature = signature;
        return dto;
    }
}