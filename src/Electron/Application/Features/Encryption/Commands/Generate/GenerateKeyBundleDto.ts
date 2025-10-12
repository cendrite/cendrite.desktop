import { SignedPreKeyDto } from "../../Dtos/SignedPreKeyDto.js";

export class GenerateKeyBundleDto {
    cacheToken: string;
    registrationId: number;
    identityKeyPublic: string;
    signedPreKey: SignedPreKeyDto;
    oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;

    constructor(
        cacheToken: string,
        registrationId: number,
        identityKeyPublic: string,
        signedPreKey: SignedPreKeyDto,
        oneTimePreKeys: Array<{ keyId: number; publicKey: string }>,
    ) {
        this.registrationId = registrationId;
        this.identityKeyPublic = identityKeyPublic;
        this.signedPreKey = signedPreKey;
        this.oneTimePreKeys = oneTimePreKeys;
        this.cacheToken = cacheToken;
    }
}
