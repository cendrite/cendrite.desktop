import { GroupEpochKey } from '#electron/Domain/Encryption/GroupEpochKey';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';

export interface IGroupKeyRepository {
    saveWriteKey(writeKey: GroupWriteKey): Promise<void>;
    getWriteKey(groupId: string): Promise<GroupWriteKey | null>;
    saveEpochKey(epochKey: GroupEpochKey): Promise<void>;
    getEpochKey(groupId: string, epoch: number): Promise<GroupEpochKey | null>;
    getEpochKeys(groupId: string): Promise<GroupEpochKey[]>;
    deleteAll(): Promise<void>;
}
