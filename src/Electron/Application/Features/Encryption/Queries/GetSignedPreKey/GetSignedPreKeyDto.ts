import { KeyPairDto } from "../../Dtos/KeyPairDto.js";

export class GetSignedPreKeyDto {
    constructor(public keyPair: KeyPairDto | null) { }
}
