import {RemoveConnectionIdCommand} from "./RemoveConnectionIdCommand.js";
import {Handler} from "../../../../Mediator/Handler.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import {FriendRepository} from "../../../../../Persistence/Repositories/FriendRepository.js";

export class RemoveConnectionIdCommandHandler implements Handler<RemoveConnectionIdCommand> {
    public async handle(request: RemoveConnectionIdCommand): Promise<Result> {
        try {
            const friendRepository = new FriendRepository();
            const friend = await friendRepository.getById(request.id);

            if (!friend) {
                return Result.fail(new ErrorMessage(null, "Friend not found"));
            }

            friend.connectionIds = friend.connectionIds.filter(conn => !request.connectionId.includes(conn.connectionId));

            await friendRepository.update(friend);
            return Result.success();

        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Removing connection ID failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Remove Connection ID Failed"));
        }
    }

}