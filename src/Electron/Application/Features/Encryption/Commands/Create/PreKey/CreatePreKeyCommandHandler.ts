import { Result } from "../../../../../../../Shared/Result/Result.js";
import { EcPreKey } from "../../../../../../Domain/Encryption/EcPreKey.js";
import { ProtocolStore } from "../../../../../../Infrastructure/Persistence/Repositories/ProtocolStore.js";
import { Handler } from "../../../../../Mediator/Handler.js";
import { CreatePreKeyCommand } from "./CreatePreKeyCommand.js";

export class CreatePreKeyCommandHandler implements Handler<CreatePreKeyCommand> {
    public async handle(request: CreatePreKeyCommand): Promise<Result> {
        const store = new ProtocolStore();

        const preKey = new EcPreKey(
        request.preKeyId, 
        request.keys.privateKey, 
        request.keys.publicKey,
        );

        await store.storePreKey(preKey);

        return Result.success();
    }
}
