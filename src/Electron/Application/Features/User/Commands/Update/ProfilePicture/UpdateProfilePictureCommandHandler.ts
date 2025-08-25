import {UpdateProfilePictureCommand} from "./UpdateProfilePictureCommand.js";
import {Handler} from "../../../../../Mediator/Handler.js";
import { Result } from "../../../../../../../Shared/Result/Result.js";
import {ErrorMessage} from "../../../../../../../Shared/Result/ErrorMessage.js";
import {UserRepository} from "../../../../../../Persistence/Repositories/UserRepository.js";

export class UpdateProfilePictureCommandHandler implements Handler<UpdateProfilePictureCommand> {

    public async handle(request: UpdateProfilePictureCommand): Promise<Result> {
        try{
            const repository = new UserRepository()

            const base64Data = request.base64ProfilePicture.replace(/^data:image\/\w+;base64,/, '');
            const profilePictureBuffer = Buffer.from(base64Data, 'base64');

            await repository.update({profilePicture: profilePictureBuffer});

            return Result.success();
        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('UpdateProfilePicture Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "UpdateProfilePicture Failed"));
        }
    }
}