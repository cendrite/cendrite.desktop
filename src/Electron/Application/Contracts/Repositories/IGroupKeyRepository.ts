import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { PendingGroupWriteKey } from '#electron/Domain/Encryption/PendingGroupWriteKey';

export interface IGroupKeyRepository {
    saveWriteKey(writeKey: GroupWriteKey): Promise<void>;
    getWriteKey(groupId: string): Promise<GroupWriteKey | null>;
    savePendingWriteKey(writeKey: PendingGroupWriteKey): Promise<void>;
    getPendingWriteKey(groupId: string): Promise<PendingGroupWriteKey | null>;
    deletePendingWriteKey(groupId: string): Promise<void>;
    saveEpochKey(epochKey: GroupEpochKey): Promise<void>;
    getEpochKey(groupId: string, epoch: number): Promise<GroupEpochKey | null>;
    getEpochKeys(groupId: string): Promise<GroupEpochKey[]>;
    deleteAll(): Promise<void>;
}
