import {Result} from "../../../../Shared/Result/Result.ts";
import {SendFriendRequestApi} from "../../../Common/Api/Friends/SendFriendRequestApi.ts";
import {DeclineFriendRequestApi} from "../../../Common/Api/Friends/DeclineFriendRequestApi.ts";

export class FriendService {
    public addFriendAPi = new SendFriendRequestApi();
    public declineFriendRequestApi = new DeclineFriendRequestApi();

    public async AddFriend(id: string, tag: string): Promise<Result>{
        return this.addFriendAPi.sendFriendRequest({id: id, friendTag: tag});
    }

    public async DeclineFriendRequest(id: string, tag: string): Promise<Result>{
        console.log("Decline friend request");
        console.log(id);
        return this.declineFriendRequestApi.declineFriendRequest({Id: id, friendTag: tag});
    }
}