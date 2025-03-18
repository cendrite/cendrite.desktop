import {ApiClient} from "../ApiClient.ts";
import {API_URLS} from "../ApiUrls.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

export interface SendFriendRequest{
    id: string
    friendTag: string
}

export class SendFriendRequestApi{
    private readonly client: ApiClient;

    constructor(){
        this.client = new ApiClient(API_URLS.USER_MANAGEMENT.SEND_FRIEND_REQUEST, true);
    }
    
    public async sendFriendRequest(request: SendFriendRequest): Promise<Result>{
        return this.client.handle({
            method: "POST",
            data: request
        }, true);
    }
}