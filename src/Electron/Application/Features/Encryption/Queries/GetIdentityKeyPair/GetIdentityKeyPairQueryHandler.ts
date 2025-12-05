import { Result } from "../../../../../../Shared/Result/Result.js";
import { ProtocolStore } from "../../../../../Persistence/Repositories/ProtocolStore.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { KeyPairDto } from "../../Dtos/KeyPairDto.js";
import { GetIdentityKeyPairQuery } from "./GetIdentityKeyPairQuery.js";


export class GetIdentityKeyPairQueryHandler implements Handler<GetIdentityKeyPairQuery, KeyPairDto> {
    public async handle(_request: GetIdentityKeyPairQuery): Promise<Result<KeyPairDto>> {
        const store = new ProtocolStore();
        const identityKeyPair = await store.getIdentityKeyPair();

        const keyPairDto: KeyPairDto = {
            privateKey: identityKeyPair.identityKeyPrivate,
            publicKey: identityKeyPair.identityKeyPublic,
        };

        return Result.success<KeyPairDto>(keyPairDto);
    }
}
