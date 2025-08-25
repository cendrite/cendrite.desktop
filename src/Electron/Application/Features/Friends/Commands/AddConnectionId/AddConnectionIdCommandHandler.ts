import { Result } from "../../../../../../Shared/Result/Result.js";
import { FriendRepository } from "../../../../../Persistence/Repositories/FriendRepository.js";
import {Handler} from "../../../../Mediator/Handler.js";
import {AddConnectionIdCommand} from "./AddConnectionIdCommand.js";
import {ErrorMessage} from "../../../../../../Shared/Result/ErrorMessage.js";
import {ConnectionId} from "../../../../../Domain/Entities/ConnectionId.js";

export class AddConnectionIdCommandHandler implements Handler<AddConnectionIdCommand> {
    public async handle(request: AddConnectionIdCommand): Promise<Result> {
        try {

            const friendRepository = new FriendRepository();
            const friend = await friendRepository.getById(request.id);

            if (!friend) {
                return Result.fail(new ErrorMessage(null, "Friend not found"));
            }

            // Add new connection IDs
            for (const connId of request.connectionId) {
                if(friend.connectionIds.some((con) => con.connectionId === connId)) {
                    console.warn(`Connection ID ${connId} already exists for friend ${friend.id}`);
                    continue;
                }
                friend.connectionIds.push(new ConnectionId(connId, friend));
            }

            await friendRepository.update(friend);
            return Result.success();

        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Adding connection ID failed:', errorMessage);
            return Result.fail(new ErrorMessage(null, "Add Connection ID Failed"));
        }
    }

}