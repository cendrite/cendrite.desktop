export class CreateIdentityCacheDto {
    isTrusted: boolean;
    constructor(isTrusted: boolean) {
        this.isTrusted = isTrusted;
    }
}
