import { KeyPairDto } from "../../Dtos/KeyPairDto.js";

export class GetPreKeyDto {
    constructor(public keyPair: KeyPairDto | null) { }
}
