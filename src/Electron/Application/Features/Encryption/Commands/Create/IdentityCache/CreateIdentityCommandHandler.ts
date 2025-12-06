import { Result } from "../../../../../../../Shared/Result/Result.js";
import { IdentityCache } from "../../../../../../Domain/Encryption/IdentityCache.js";
import { ProtocolStore } from "../../../../../../Persistence/Repositories/ProtocolStore.js";
import { Handler } from "../../../../../Mediator/Handler.js";
import { CreateIdentityCacheDto } from "./CreateIdentityCacheDto.js";
import { CreateIdentityCommand } from "./CreateIdentityCommand.js";


export class CreateIdentityCommandHandler implements Handler<CreateIdentityCommand, CreateIdentityCacheDto> { 
    public async handle(request: CreateIdentityCommand): Promise<Result<CreateIdentityCacheDto>> {
        const store = new ProtocolStore();

        const existing = await store.getIdentityCache(request.encodedAddress);
        const now = Date.now();

        if (!existing) {
            const entry = new IdentityCache(
                request.encodedAddress,
                request.pubKey,
                true,
                now
            );

            await store.saveIdentity(entry);
            return Result.success(new CreateIdentityCacheDto(true));
        }

        const same = existing.identityKeyPublic.equals(request.pubKey);

        if (same) {
            existing.timestamp = now;
            await store.saveIdentity(existing);
            return Result.success(new CreateIdentityCacheDto(true));
        }

        if (!request.nonBlockingApproval) {
            return Result.success(new CreateIdentityCacheDto(false));
        }

        existing.identityKeyPublic = request.pubKey;
        existing.timestamp = now;
        existing.trusted = true;

        await store.saveIdentity(existing);

        return Result.success(new CreateIdentityCacheDto(true));
    }
}

