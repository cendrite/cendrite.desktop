import { GroupEpochKey } from '../../../Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../Domain/Encryption/GroupWriteKey.js';

export interface IGroupKeyRepository {
    saveWriteKey(writeKey: GroupWriteKey): Promise<void>;
    getWriteKey(groupId: string): Promise<GroupWriteKey | null>;
    saveEpochKey(epochKey: GroupEpochKey): Promise<void>;
    getEpochKey(groupId: string, epoch: number): Promise<GroupEpochKey | null>;
    getEpochKeys(groupId: string): Promise<GroupEpochKey[]>;
    deleteAll(): Promise<void>;
}
