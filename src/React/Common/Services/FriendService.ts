import {ErrorMessage} from "../../../Shared/Result/ErrorMessage";
import {Result} from "../../../Shared/Result/Result";
import {AcceptFriendshipApi} from "../Api/Friends/AcceptFriendRequestApi";
import {DeclineFriendRequestApi} from "../Api/Friends/DeclineFriendRequestApi";
import {SendFriendRequestApi} from "../Api/Friends/SendFriendRequestApi";
import {PendingContact} from "../../Context/PendingContactContext.tsx";
import {GetFriendRequestsApi} from "../Api/Friends/GetFriendRequestsApi.ts";
import {DeleteFriendCommand} from "../../../Electron/Application/Features/Friends/Commands/Delete/DeleteFriendCommand.ts";
import {DeleteFriendApi} from "../Api/Friends/DeleteFriendApi.ts";

export class FriendService {
    private readonly addFriendAPi = new SendFriendRequestApi();
    private readonly declineFriendRequestApi = new DeclineFriendRequestApi();
    private readonly acceptFriendshipApi = new AcceptFriendshipApi();
    private readonly getFriendRequestsApi = new GetFriendRequestsApi();
    private readonly deleteFriendApi = new DeleteFriendApi();

    public async AddFriend(id: string, tag: string): Promise<Result> {
        return this.addFriendAPi.sendFriendRequest({id: id, friendTag: tag});
    }

    public async DeclineFriendRequest(id: string, tag: string): Promise<Result> {
        return this.declineFriendRequestApi.declineFriendRequest({Id: id, friendTag: tag});
    }

    public async GetFriendRequests(id: string): Promise<Array<PendingContact>> {
        const r_result = await this.getFriendRequestsApi.getFriendRequests({userId: id});

        if (!r_result.success || !r_result.data) return [];

        console.log("Friend requests", r_result.data)
        const contacts = new Set<PendingContact>(
            r_result.data.map(friend =>
                new PendingContact(
                    friend.userTag,
                    friend.username,
                    false,
                    friend.displayName,
                    friend.profilePictureUrl,
                )
            )
        );

        return Array.from(contacts);
    }

    public async AcceptFriendship(userId: string, friendTag: string): Promise<Result> {
        const acceptResult = await this.acceptFriendshipApi.acceptFriendship({Id: userId, friendTag: friendTag});
        if (!acceptResult.success) {
            console.error("Failed to accept friendship");
            return Result.fail(new ErrorMessage(null, "Failed to accept friendship"));
        }
        return Result.success();
    }

    public async DeleteFriend(id: string, tag: string): Promise<Result> {
        console.log("Deleting friend with tag", tag);
        const result = await window.electron.sendRequestAsync<Result>(new DeleteFriendCommand(tag));
        if (!result.success) {
            console.error("Failed to delete friend");
            return Result.fail(new ErrorMessage(null, "Failed to delete friend"));
        }

        const deleteResult = await this.deleteFriendApi.deleteFriend({Id: id, friendTag: tag});

        if (!deleteResult.success) {
            console.error("Failed to delete friend");
            return Result.fail(new ErrorMessage(null, "Failed to delete friend"));
        }

        return Result.success();
    }
}