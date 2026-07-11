import { Result } from "../../../../../../Shared/Result/Result.js";
import { ProtocolStore } from "../../../../../Infrastructure/Persistence/Repositories/ProtocolStore.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { KeyPairDto } from "../../Dtos/KeyPairDto.js";
import { GetSignedPreKeyDto } from "./GetSignedPreKeyDto.js";
import { GetSignedPreKeyQuery } from "./GetSignedPreKeyQuery.js";

export class GetSignedPreKeyQueryHandler implements Handler<GetSignedPreKeyQuery, GetSignedPreKeyDto> {
    public async handle(request: GetSignedPreKeyQuery): Promise<Result<GetSignedPreKeyDto>> {
        const store = new ProtocolStore();
        const signedPreKey = await store.getSignedPreKey(request.signedPreKeyId);

        if (!signedPreKey) {
            const dto = new GetSignedPreKeyDto(null);
            return Result.success<GetSignedPreKeyDto>(dto);
        }

        const keyPairDto = new KeyPairDto(
            signedPreKey.publicKey,
            signedPreKey.privateKey,
        );

        const dto = new GetSignedPreKeyDto(keyPairDto);

        return Result.success<GetSignedPreKeyDto>(dto);
    }  
}
