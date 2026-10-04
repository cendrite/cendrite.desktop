import { EntitySchema } from 'typeorm';
import { GroupEpochKey } from '../../../Domain/Encryption/GroupEpochKey.js';
import { BaseSchema } from './BaseSchema.js';

export const GroupEpochKeySchema = new EntitySchema<GroupEpochKey>({
    name: 'GroupEpochKey',
    target: GroupEpochKey,
    columns: {
        ...BaseSchema.columns,
        groupId: {
            type: 'uuid',
            primary: true,
        },
        epoch: {
            type: 'integer',
            primary: true,
        },
        key: {
            type: 'blob',
            nullable: false,
        },
    },
});
