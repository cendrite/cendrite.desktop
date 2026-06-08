import {GetFriendsApi} from "../Api/Friends/GetFriendsApi.ts";
import {Result} from "../../../Shared/Result/Result.ts";
import {FriendDto} from "../../../Electron/Application/Features/Friends/Dto/FriendDto.ts";
import {GetFriendsQuery} from "../../../Electron/Application/Features/Friends/Queries/GetFriends/GetFriendsQuery.ts";
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
    RemoveFriendConnectionIdCommand
} from "../../../Electron/Application/Features/Friends/Commands/RemoveConnectionId/RemoveFriendConnectionIdCommand.ts";
import {
    AddFriendConnectionIdCommand
} from "../../../Electron/Application/Features/Friends/Commands/AddConnectionId/AddFriendConnectionIdCommand.ts";
import { Contact } from "../../Models/Contact.ts";

interface ConnectionDiff {
    friendId: string;
    newConnectionIds: string[];
    staleConnectionIds: string[];
}

export class FriendSyncService {
    private readonly getFriendsApi = new GetFriendsApi();

    public async SyncFriends(): Promise<Array<Contact>> {
        const localMap = await this.LoadLocalContacts();
        const remoteMap = await this.LoadRemoteContacts();

        const toDelete = Array.from(localMap.keys())
            .filter(localId => !remoteMap.has(localId));

        const toCreate = Array.from(remoteMap.entries())
            .filter(([id]) => !localMap.has(id))
            .map(([, rc]) => rc);

        const toUpdate = Array.from(remoteMap.entries())
            .filter(([id, rc]) => {
                const lc = localMap.get(id);
                return lc && (lc.username !== rc.username || lc.displayName !== rc.displayName || lc.avatarKey !== rc.avatarKey);
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
                window.electron.sendRequestAsync(new CreateFriendCommand(rc.username, rc.displayName, rc.connectionIds, rc.id, rc.avatarKey))
            ),
            ...toUpdate.map(rc =>
                window.electron.sendRequestAsync(new UpdateFriendCommand(rc.id, rc.username, rc.displayName, rc.avatarKey))
            ),
            ...connDiffs.map(diff =>
                window.electron.sendRequestAsync(new RemoveFriendConnectionIdCommand(diff.friendId, ...diff.staleConnectionIds))
            ),
            ...connDiffs.map(diff =>
                window.electron.sendRequestAsync(new AddFriendConnectionIdCommand(diff.friendId, ...diff.newConnectionIds))
            ),
        ]);

        return Array.from(remoteMap.values());
    }

    private async LoadLocalContacts(): Promise<Map<string, Contact>> {
        const contacts = new Map<string, Contact>();
        const result = await window.electron.sendRequestAsync<Result<Array<FriendDto>>>(new GetFriendsQuery());
        console.log("Local friends loaded:", result);

        if (result.success && result.data) {
            for (const friend of result.data) {
                const contact = new Contact(friend.id, friend.username, friend.displayName, friend.avatarKey, friend.connectionIds);
                contacts.set(friend.id, contact);
            }
        }
        return contacts;
    }

    private async LoadRemoteContacts(): Promise<Map<string, Contact>> {
        const contacts = new Map<string, Contact>();
        const result = await this.getFriendsApi.getFriends();
        if (!result.success || !result.data) return contacts;
        console.log("Remote friends loaded:", result);

        
        const entries = result.data.map(rc => {
            const contact = new Contact(
                rc.userTag,
                rc.username,
                rc.displayName,
                rc.avatarKey,
                rc.connectionIds
            );
            return [contact.id, contact] as [string, Contact];
        });

        for (const [id, contact] of entries) {
            contacts.set(id, contact);
        }

        return contacts;
    }
}
