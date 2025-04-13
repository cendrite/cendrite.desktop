import { ErrorMessage } from "../../../Shared/Result/ErrorMessage";
import { Result } from "../../../Shared/Result/Result";
import {AcceptFriendshipApi } from "../Api/Friends/AcceptFriendRequestApi";
import { DeclineFriendRequestApi } from "../Api/Friends/DeclineFriendRequestApi";
import {SendFriendRequestApi } from "../Api/Friends/SendFriendRequestApi";
import {
    CreateFriendCommand
} from "../../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand.ts";
import {GetFriendsQuery} from "../../../Electron/Application/Features/Friends/Queries/GetFriends/GetFriendsQuery.ts";
import {FriendDto} from "../../../Electron/Application/Features/Friends/Dto/FriendDto.ts";
import {GetFriendsApi} from "../Api/Friends/GetFriendsApi.ts";
import {ImageHelper} from "../Api/Utility/ImageFetcher.ts";
import {GetUserProfilePictureApi} from "../Api/UserProfile/GetUserProfilePicture.ts";
import { Contact } from "../../Context/ContactContext.tsx";

export class FriendService {
    private readonly addFriendAPi = new SendFriendRequestApi();
    private readonly declineFriendRequestApi = new DeclineFriendRequestApi();
    private readonly acceptFriendshipApi = new AcceptFriendshipApi();
    private readonly getFriendsApi = new GetFriendsApi();
    private readonly pictureApi = new GetUserProfilePictureApi();

    public async AddFriend(id: string, tag: string): Promise<Result> {
        return this.addFriendAPi.sendFriendRequest({ id: id, friendTag: tag });
    }

    public async DeclineFriendRequest(id: string, tag: string): Promise<Result> {
        console.log("Decline friend request");
        console.log(id);
        return this.declineFriendRequestApi.declineFriendRequest({ Id: id, friendTag: tag });
    }

    public async GetFriends(id: string): Promise<Array<Contact>>{
        const contacts = new Set<Contact>();
        const result = await window.electron.sendRequestAsync<Result<Array<FriendDto>>>(new GetFriendsQuery());

        if(result.success && result.data !== null){
            for(const friend of result.data){
                console.log("Profile picture", friend.profilePicture);
                const contact = new Contact(friend.id, friend.username, friend.displayName, friend.profilePicture, friend.connectionIds);
                contacts.add(contact);
            }
        }

        const remoteResult = await this.getFriendsApi.getFriends({UserProfileId: id});
        if(remoteResult.success && remoteResult.data !== null && remoteResult.data.length > 0){
            for(const r_friend of remoteResult.data){
                if(this.IsNewContact(r_friend.userTag, contacts)){

                    const base64ProfilePicture = r_friend.profilePictureUrl ? await this.FetchProfilePicture(r_friend.profilePictureUrl) : null;

                    const contact = new Contact(r_friend.userTag, r_friend.username, r_friend.displayName, base64ProfilePicture, r_friend.connectionIds);
                    contacts.add(contact);

                    await window.electron.sendRequestAsync<Result>(new CreateFriendCommand(
                        r_friend.username,
                        r_friend.displayName,
                        r_friend.connectionIds,
                        r_friend.userTag,
                        base64ProfilePicture));
                }
            }
        }

        return Array.from(contacts);
    }

    public async AcceptFriendship(userId: string, friendTag: string): Promise<Result<Contact>> {
        const acceptResult = await this.acceptFriendshipApi.acceptFriendship({ Id: userId, friendTag: friendTag });
        if(!acceptResult.success) {
            console.error("Failed to accept friendship");
            return Result.fail<Contact>(new ErrorMessage(null, "Failed to accept friendship"));
        }

        const friend = acceptResult.data;
        if(!friend) {
            console.error("Failed to accept friendship");
            return Result.fail<Contact>(new ErrorMessage(null, "Failed to accept friendship"));
        }
        const base64ProfilePicture = friend.profilePictureUrl ? await ImageHelper.downloadImageAsBase64(friend.profilePictureUrl) : null;
        const storeFriendResult = await window.electron.sendRequestAsync<Result>(new CreateFriendCommand(
            friend.username!,
            friend.displayName ?? null,
            friend.connectionIds,
            friend.tag,
            base64ProfilePicture
        ));

        if(!storeFriendResult.success) {
            console.error("Failed to store friend");
            return Result.fail<Contact>(new ErrorMessage(null, "Failed to store friend"));
        }

        return Result.success(new Contact(friend.tag, friend.username!, friend.displayName ?? null, base64ProfilePicture, friend.connectionIds));
    }

    private IsNewContact(id: string, friends: Set<Contact>) : boolean {
        for(const friend of friends) {
            if(friend.id === id) {
                return false;
            }
        }
        return true;
    }

    private async FetchProfilePicture(url: string): Promise<string | null> {
        if (!url) return null;
        const profilePictureResult = await this.pictureApi.getUserProfilePicture({ profilePictureUrl: url });

        if (!profilePictureResult.success) {
            console.error(profilePictureResult.errorMessage);
            return null;
        }

        return profilePictureResult.data?.base64ProfilePicture ?? null;
    }
}