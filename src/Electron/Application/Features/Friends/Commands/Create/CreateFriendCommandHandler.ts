import {Result} from "../../../../../../Shared/Result/Result.js";
import {FriendRepository} from "../../../../../Persistence/Repositories/FriendRepository.js";
import {Handler} from "../../../../Mediator/Handler.js";
import {ImageConverter} from "../../../../Services/Images/ImageConverter.js";
import {CreateFriendCommand} from "./CreateFriendCommand.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import {ConnectionId} from "../../../../../Domain/Entities/ConnectionId.js";
import {Friend} from "../../../../../Domain/Aggregates/Friend.js";

export class CreateFriendCommandHandler implements Handler<CreateFriendCommand> {
    public async handle(request: CreateFriendCommand): Promise<Result> {
        try {
            const friendRepository = new FriendRepository();
            const imageConverter = new ImageConverter();
            const friend = new Friend();
            friend.username = request.username;
            friend.displayName = request.displayName;
            friend.profilePicture = request.base64ProfilePicture ? await imageConverter.base64ToBuffer(request.base64ProfilePicture) : null;

            friend.connectionIds = request.connectionId.map(connId => {
                return new ConnectionId(connId);
            });

            friend.tag = request.tag;
            await friendRepository.create(friend);

            return Result.success();
        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Create Refresh Token Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Create Refresh Token Failed"));
        }
    }
}
