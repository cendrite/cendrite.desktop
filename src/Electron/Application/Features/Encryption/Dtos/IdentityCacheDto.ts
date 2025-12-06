export class IdentityCacheDto {
    identityKeyPublic: Buffer;
    isTrusted: boolean;
    constructor(identityKeyPublic: Buffer, isTrusted: boolean) {
        this.identityKeyPublic = identityKeyPublic;
        this.isTrusted = isTrusted;
    }
}
