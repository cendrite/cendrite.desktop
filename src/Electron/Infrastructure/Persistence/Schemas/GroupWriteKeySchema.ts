import { EntitySchema } from 'typeorm';
import { GroupWriteKey } from '../../../Domain/Encryption/GroupWriteKey.js';
import { BaseSchema } from './BaseSchema.js';

export const GroupWriteKeySchema = new EntitySchema<GroupWriteKey>({
    name: 'GroupWriteKey',
    target: GroupWriteKey,
    columns: {
        ...BaseSchema.columns,
        groupId: {
            type: 'uuid',
            primary: true,
        },
        publicKey: {
            type: 'blob',
            nullable: false,
        },
        privateKey: {
            type: 'blob',
            nullable: false,
        },
    },
});
