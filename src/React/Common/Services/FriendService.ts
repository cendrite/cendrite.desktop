import {ErrorMessage} from "../../../Shared/Result/ErrorMessage";
import {Result} from "../../../Shared/Result/Result";
import {AcceptFriendshipApi} from "../Api/Friends/AcceptFriendRequestApi";
import {DeclineFriendRequestApi} from "../Api/Friends/DeclineFriendRequestApi";
import {SendFriendRequestApi} from "../Api/Friends/SendFriendRequestApi";
import {
    CreateFriendCommand
} from "../../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand.ts";
import {GetFriendsQuery} from "../../../Electron/Application/Features/Friends/Queries/GetFriends/GetFriendsQuery.ts";
import {FriendDto} from "../../../Electron/Application/Features/Friends/Dto/FriendDto.ts";
import {GetFriendsApi} from "../Api/Friends/GetFriendsApi.ts";
import {GetUserProfilePictureApi} from "../Api/UserProfile/GetUserProfilePicture.ts";
import {Contact} from "../../Context/ContactContext.tsx";
import {PendingContact} from "../../Context/PendingContactContext.tsx";
import {GetFriendRequestsApi} from "../Api/Friends/GetFriendRequestsApi.ts";
import {
    DeleteFriendCommand
} from "../../../Electron/Application/Features/Friends/Commands/Delete/DeleteFriendCommand.ts";
import {DeleteFriendApi} from "../Api/Friends/DeleteFriendApi.ts";

export class FriendService {
    private readonly addFriendAPi = new SendFriendRequestApi();
    private readonly declineFriendRequestApi = new DeclineFriendRequestApi();
    private readonly acceptFriendshipApi = new AcceptFriendshipApi();
    private readonly getFriendsApi = new GetFriendsApi();
    private readonly pictureApi = new GetUserProfilePictureApi();
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
    public async SyncFriends(id: string): Promise<Array<Contact>> {
        const localContacts = await this.LoadLocalContacts();
        const remoteContacts = await this.LoadRemoteContacts(id);

        await this.RemoveStaleContacts(localContacts, remoteContacts);
        await this.MergeContacts(localContacts, remoteContacts);

        return Array.from(localContacts.values());
    }

    private async LoadLocalContacts(): Promise<Map<string, Contact>>{
        const contacts = new Map<string, Contact>();
        const result = await window.electron.sendRequestAsync<Result<Array<FriendDto>>>(new GetFriendsQuery());

        if (result.success && result.data) {
            for (const friend of result.data) {
                const contact = new Contact(friend.id, friend.username, friend.displayName, friend.profilePicture, friend.connectionIds);
                contacts.set(friend.id, contact);
            }
        }

        return contacts;
    }

    private async LoadRemoteContacts(id: string): Promise<Contact[]> {
        const result = await this.getFriendsApi.getFriends({UserProfileId: id});
        if (!result.success || !result.data) return [];

        return await Promise.all(result.data.map(async (friend) => {
            const base64ProfilePicture = friend.profilePictureUrl ? await this.FetchProfilePicture(friend.profilePictureUrl) : null;
            return new Contact(friend.userTag, friend.username, friend.displayName, base64ProfilePicture, friend.connectionIds);
        }));
    }

    private async MergeContacts(localContacts: Map<string, Contact>, remoteContacts: Contact[]): Promise<void> {
        for (const rc of remoteContacts) {
            if (!localContacts.has(rc.id)) {
                localContacts.set(rc.id, rc);
                await window.electron.sendRequestAsync<Result>(
                    new CreateFriendCommand(rc.username, rc.displayName, rc.connectionIds, rc.id, rc.profilePicture)
                );
            }
        }
    }

    private async RemoveStaleContacts(contacts: Map<string, Contact>, remoteContacts: Contact[]): Promise<void> {
        const remoteContactIds = new Set(remoteContacts.map(contact => contact.id));
        for (const [id, contact] of contacts) {
            if (!remoteContactIds.has(id)) {
                await window.electron.sendRequestAsync<Result>(new DeleteFriendCommand(contact.id));
                contacts.delete(id);
            }
        }
    }

    public async AcceptFriendship(userId: string, friendTag: string): Promise<Result> {
        const acceptResult = await this.acceptFriendshipApi.acceptFriendship({Id: userId, friendTag: friendTag});
        if (!acceptResult.success) {
            console.error("Failed to accept friendship");
            return Result.fail(new ErrorMessage(null, "Failed to accept friendship"));
        }
        return Result.success();
    }

    private async FetchProfilePicture(url: string): Promise<string | null> {
        if (!url) return null;
        try {
            const profilePictureResult =
                await this.pictureApi.getUserProfilePicture({profilePictureUrl: url});

            if (!profilePictureResult.success) {
                console.error(profilePictureResult.errorMessage);
                return null;
            }

            return profilePictureResult.data?.base64ProfilePicture ?? null;
        } catch (err) {
            console.error("Failed to fetch profile picture:", err);
            return null;
        }
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