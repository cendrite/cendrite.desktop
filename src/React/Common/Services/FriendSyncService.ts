import {GetFriendsApi} from "../Api/Friends/GetFriendsApi.ts";
import {Contact} from "../../Context/ContactContext.tsx";
import {Result} from "../../../Shared/Result/Result.ts";
import {FriendDto} from "../../../Electron/Application/Features/Friends/Dto/FriendDto.ts";
import {GetFriendsQuery} from "../../../Electron/Application/Features/Friends/Queries/GetFriends/GetFriendsQuery.ts";
import {ProfilePictureService} from "./ProfilePictureService.ts";
import {
    DeleteFriendCommand
} from "../../../Electron/Application/Features/Friends/Commands/Delete/DeleteFriendCommand.ts";
import {
    CreateFriendCommand
} from "../../../Electron/Application/Features/Friends/Commands/Create/CreateFriendCommand.ts";
import {
    UpdateFriendCommand
} from "../../../Electron/Application/Features/Friends/Commands/Update/UpdateFriendCommand.ts";
import {
    RemoveConnectionIdCommand
} from "../../../Electron/Application/Features/Friends/Commands/RemoveConnectionId/RemoveConnectionIdCommand.ts";
import {
    AddConnectionIdCommand
} from "../../../Electron/Application/Features/Friends/Commands/AddConnectionId/AddConnectionIdCommand.ts";

interface ConnectionDiff {
    friendId: string;
    newConnectionIds: string[];
    staleConnectionIds: string[];
}

export class FriendSyncService {
    private readonly getFriendsApi = new GetFriendsApi();
    private readonly profilePictureService = new ProfilePictureService();

    public async SyncFriends(id: string): Promise<Array<Contact>> {
        const localMap = await this.LoadLocalContacts();
        const remoteMap = await this.LoadRemoteContacts(id);

        const toDelete = Array.from(localMap.keys())
            .filter(localId => !remoteMap.has(localId));

        const toCreate = Array.from(remoteMap.entries())
            .filter(([id]) => !localMap.has(id))
            .map(([, rc]) => rc);

        const toUpdate = Array.from(remoteMap.entries())
            .filter(([id, rc]) => {
                const lc = localMap.get(id);
                return lc && (lc.username !== rc.username || lc.displayName !== rc.displayName || lc.profilePicture !== rc.profilePicture);
            })
            .map(([, rc]) => rc);

        const connDiffs: ConnectionDiff[] = Array.from(remoteMap.values()).map(rc => {
            const lc = localMap.get(rc.id);
            if (!lc) {
                console.warn(`Local contact not found for remote contact ${rc.id}`);
                return null;
            }
            const newConnectionIds = rc.connectionIds.filter(id => !lc.connectionIds.includes(id));
            const staleConnectionIds = lc.connectionIds.filter(id => !rc.connectionIds.includes(id));

            if (newConnectionIds.length === 0 && staleConnectionIds.length === 0) return null;
            return {
                friendId: rc.id,
                newConnectionIds,
                staleConnectionIds
            };
        }).filter((diff): diff is ConnectionDiff => diff !== null);

        await Promise.all([
            ...toDelete.map(id =>
                window.electron.sendRequestAsync(new DeleteFriendCommand(id))
            ),
            ...toCreate.map(rc =>
                window.electron.sendRequestAsync(new CreateFriendCommand(rc.username, rc.displayName, rc.connectionIds, rc.id, rc.profilePicture))
            ),
            ...toUpdate.map(rc =>
                window.electron.sendRequestAsync(new UpdateFriendCommand(rc.id, rc.username, rc.displayName, rc.profilePicture))
            ),
            ...connDiffs.map(diff =>
                window.electron.sendRequestAsync(new RemoveConnectionIdCommand(diff.friendId, ...diff.staleConnectionIds))
            ),
            ...connDiffs.map(diff =>
                window.electron.sendRequestAsync(new AddConnectionIdCommand(diff.friendId, ...diff.newConnectionIds))
            ),
        ]);

        return Array.from(remoteMap.values());
    }

    private async LoadLocalContacts(): Promise<Map<string, Contact>> {
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

    private async LoadRemoteContacts(id: string): Promise<Map<string, Contact>> {
        const contacts = new Map<string, Contact>();
        const result = await this.getFriendsApi.getFriends({UserProfileId: id});
        if (!result.success || !result.data) return contacts;

        const entries = await Promise.all(
            result.data.map(async rc => {
                const pic = rc.profilePictureUrl ? await this.profilePictureService.FetchProfilePicture(rc.profilePictureUrl) : null;
                const contact = new Contact(
                    rc.userTag,
                    rc.username,
                    rc.displayName,
                    pic,
                    rc.connectionIds
                );
                return [contact.id, contact] as [string, Contact];
            })
        );

        for (const [id, contact] of entries) {
            contacts.set(id, contact);
        }

        return contacts;
    }
}