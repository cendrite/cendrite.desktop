import {Result} from "../../../../../../Shared/Result/Result.js";
import {FriendRepository} from "../../../../../Infrastructure/Persistence/Repositories/FriendRepository.js";
import {Handler} from "../../../../Mediator/Handler.js";
import {CreateFriendCommand} from "./CreateFriendCommand.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import {Friend} from "../../../../../Domain/Aggregates/Friend.js";
import {FriendConnectionId} from "../../../../../Domain/Entities/FriendConnectionId.js";

export class CreateFriendCommandHandler implements Handler<CreateFriendCommand> {
    public async handle(request: CreateFriendCommand): Promise<Result> {
        try {
            const friendRepository = new FriendRepository();
            const friend = new Friend();
            friend.id = request.tag;
            friend.username = request.username;
            friend.displayName = request.displayName;
            friend.avatarKey = request.avatarKey 

            if (request.connectionIds) {
                friend.connectionIds = request.connectionIds.map(id => new FriendConnectionId(id, friend));
            } else {
                friend.connectionIds = [];
            }

            console.log("Creating new friend:", friend);
            await friendRepository.create(friend);
            return Result.success();

        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Create Refresh Token Failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Create Refresh Token Failed"));
        }
    }
}
