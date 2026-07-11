import { Result } from "../../../../../../Shared/Result/Result.js";
import { ProtocolStore } from "../../../../../Infrastructure/Persistence/Repositories/ProtocolStore.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { IdentityCacheDto } from "../../Dtos/IdentityCacheDto.js";
import { GetIdentityCacheQuery } from "./GetIdentityCacheQuery.js";

export class GetIdentityCacheQueryHandler implements Handler<GetIdentityCacheQuery, IdentityCacheDto | null>
{
    public async handle(request: GetIdentityCacheQuery): Promise<Result<IdentityCacheDto | null>> {
        const store = new ProtocolStore();

        const existing = await store.getIdentityCache(request.encodedAddress);
        
        if (!existing) {
            return Result.success(null);
        }

        const dto = new IdentityCacheDto(
            existing.identityKeyPublic,
            existing.trusted,
        );

        return Result.success(dto);
    }
}
