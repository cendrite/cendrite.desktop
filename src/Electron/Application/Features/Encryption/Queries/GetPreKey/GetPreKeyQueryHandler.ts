import { Result } from "../../../../../../Shared/Result/Result.js";
import { ProtocolStore } from "../../../../../Persistence/Repositories/ProtocolStore.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { KeyPairDto } from "../../Dtos/KeyPairDto.js";
import { GetPreKeyDto } from "./GetPreKeyDto.js";
import { GetPreKeyQuery } from "./GetPreKeyQuery.js";

export class GetPreKeyQueryHandler implements Handler<GetPreKeyQuery, GetPreKeyDto> {
    public async handle(request: GetPreKeyQuery): Promise<Result<GetPreKeyDto>> {
        const store = new ProtocolStore();
        const preKey = await store.getPreKey(request.preKeyId);

        if (!preKey) {
            const dto = new GetPreKeyDto(null);
            return Result.success<GetPreKeyDto>(dto);
        }
        const keyPair = new KeyPairDto(preKey.publicKey, preKey.privateKey);
        return Result.success<GetPreKeyDto>(new GetPreKeyDto(keyPair));
    }
}
