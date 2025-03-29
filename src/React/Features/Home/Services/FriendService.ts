import { Result } from "../../../../Shared/Result/Result.ts";
import { SendFriendRequestApi } from "../../../Common/Api/Friends/SendFriendRequestApi.ts";
import { DeclineFriendRequestApi } from "../../../Common/Api/Friends/DeclineFriendRequestApi.ts";
import { AcceptFriendshipApi } from "../../../Common/Api/Friends/AcceptFriendRequestApi";
import {ErrorMessage} from "../../../../Shared/Result/ErrorMessage.ts";
import {
    CreateFriendCommand
} from "../../../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand.ts";
import {GetUserProfilePictureApi} from "../../../Common/Api/UserProfile/GetUserProfilePicture.ts";

export class FriendService {
    private readonly addFriendAPi = new SendFriendRequestApi();
    private readonly declineFriendRequestApi = new DeclineFriendRequestApi();
    private readonly acceptFriendshipApi = new AcceptFriendshipApi();
    private readonly getUserProfilePictureApi = new GetUserProfilePictureApi();

    public async AddFriend(id: string, tag: string): Promise<Result> {
        return this.addFriendAPi.sendFriendRequest({ id: id, friendTag: tag });
    }

    public async DeclineFriendRequest(id: string, tag: string): Promise<Result> {
        console.log("Decline friend request");
        console.log(id);
        return this.declineFriendRequestApi.declineFriendRequest({ Id: id, friendTag: tag });
    }

    public async AcceptFriendship(userId: string, friendTag: string): Promise<Result> {
        const acceptResult = await this.acceptFriendshipApi.acceptFriendship({ Id: userId, friendTag: friendTag });
        if(!acceptResult.success) {
            console.error("Failed to accept friendship");
            return Result.fail(new ErrorMessage(null, "Failed to accept friendship"));
        }

        const friend = acceptResult.data;
        if(!friend) {
            console.error("Failed to accept friendship");
            return Result.fail(new ErrorMessage(null, "Failed to accept friendship"));
        }

        let base64ProfilePicture: string | null = null;
        if(!friend.profilePictureUrl) {
            const profilePictureResult = await this.getUserProfilePictureApi.getUserProfilePicture({ profilePictureUrl: friend.profilePictureUrl! });
            if(!profilePictureResult.success) {
                console.log("Failed to get profile picture, with error: ", profilePictureResult.errorMessage);
            }
            base64ProfilePicture = profilePictureResult.data?.base64ProfilePicture ?? null;
        }

        const storeFriendResult = await window.electron.sendRequestAsync<Result>(new CreateFriendCommand(
            friend.username!,
            friend.displayName ?? null,
            friend.connectionIds,
            friend.tag,
            base64ProfilePicture ?? null
        ));

        if(!storeFriendResult.success) {
            console.error("Failed to store friend");
            return Result.fail(new ErrorMessage(null, "Failed to store friend"));
        }

        return Result.success();
    }
}