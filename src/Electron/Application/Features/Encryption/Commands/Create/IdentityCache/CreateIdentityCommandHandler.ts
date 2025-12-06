import { Result } from "../../../../../../../Shared/Result/Result.js";
import { IdentityCache } from "../../../../../../Domain/Encryption/IdentityCache.js";
import { ProtocolStore } from "../../../../../../Persistence/Repositories/ProtocolStore.js";
import { Handler } from "../../../../../Mediator/Handler.js";
import { IdentityCacheDto } from "../../../Dtos/IdentityCacheDto.js";
import { CreateIdentityCommand } from "./CreateIdentityCommand.js";


export class CreateIdentityCommandHandler implements Handler<CreateIdentityCommand, IdentityCacheDto> {
    public async handle(request: CreateIdentityCommand): Promise<Result<IdentityCacheDto>> {
        const store = new ProtocolStore();

        const existing = await store.getIdentity(request.encodedAddress);
        const now = Date.now();

        if (!existing) {
            const entry = new IdentityCache(
                request.encodedAddress,
                request.pubKey,
                true,
                now
            );

            await store.saveIdentity(entry);
            return Result.success(new IdentityCacheDto(true));
        }

        const same = existing.identityKeyPublic.equals(request.pubKey);

        if (same) {
            existing.timestamp = now;
            await store.saveIdentity(existing);
            return Result.success(new IdentityCacheDto(true));
        }

        if (!request.nonBlockingApproval) {
            return Result.success(new IdentityCacheDto(false));
        }

        existing.identityKeyPublic = request.pubKey;
        existing.timestamp = now;
        existing.trusted = true;

        await store.saveIdentity(existing);

        return Result.success(new IdentityCacheDto(true));
    }
}

