import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { PersistKeyBundleCommand } from "./PersistKeyBundleCommand.js";

export class PersistsKeyBundleCommandHandler implements Handler<PersistKeyBundleCommand, void> {
    handle(request: PersistKeyBundleCommand): Promise<Result<void>> {
        throw new Error("Method not implemented.");
    }
}
