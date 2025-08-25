import {UpdateFriendCommand} from "./UpdateFriendCommand.js";
import {Handler} from "../../../../Mediator/Handler.js";
import {Result} from "../../../../../../Shared/Result/Result.js";
import {ImageConverter} from "../../../../Services/Images/ImageConverter.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import {FriendRepository} from "../../../../../Persistence/Repositories/FriendRepository.js";

export class UpdateFriendCommandHandler implements Handler<UpdateFriendCommand> {
    public async handle(request: UpdateFriendCommand): Promise<Result> {
        try {
            const friendRepository = new FriendRepository();
            const friend = await friendRepository.getById(request.id);

            if (!friend) {
                return Result.fail(new ErrorMessage(null, "Friend not found"));
            }

            if (request.username !== null) {
                friend.username = request.username;
            }
            if (request.displayName !== null) {
                friend.displayName = request.displayName;
            }
            if (request.profilePicture !== null) {
                friend.profilePicture = await ImageConverter.base64ToBuffer(request.profilePicture);
            }

            await friendRepository.update(friend);
            return Result.success();
        }catch(error) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Updating friend locally failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Friend update failed"));
        }
    }
}