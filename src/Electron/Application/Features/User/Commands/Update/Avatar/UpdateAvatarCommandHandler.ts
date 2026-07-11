import {Handler} from "../../../../../Mediator/Handler.js";
import {UpdateAvatarCommand} from "./UpdateAvatarCommand.js";
import { Result } from "../../../../../../../Shared/Result/Result.js";
import {ErrorMessage} from "../../../../../../../Shared/Result/ErrorMessage.js";
import {UserRepository} from "../../../../../../Infrastructure/Persistence/Repositories/UserRepository.js";

export class UpdateAvatarCommandHandler implements Handler<UpdateAvatarCommand> {

    public async handle(cmd: UpdateAvatarCommand): Promise<Result> {
        try{
            const repository = new UserRepository()

            const user = await repository.get(false);

            user.setAvatar(cmd.avatarKey);

            await repository.update(user);

            return Result.success();
        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('UpdateProfilePicture Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "UpdateProfilePicture Failed"));
        }
    }
}
