import { EntitySchema } from 'typeorm';
import { GroupRecord } from '../../../Domain/Entities/GroupRecord.js';
import { BaseSchema } from './BaseSchema.js';

export const GroupRecordSchema = new EntitySchema<GroupRecord>({
    name: 'GroupRecord',
    target: GroupRecord,
    columns: {
        ...BaseSchema.columns,
        groupId: {
            type: 'uuid',
            primary: true,
        },
        lifecycle: {
            type: 'integer',
            nullable: false,
        },
        version: {
            type: 'integer',
            nullable: false,
            default: 0,
        },
        headHash: {
            type: 'blob',
            nullable: false,
        },
        epoch: {
            type: 'integer',
            nullable: false,
            default: 1,
        },
        archived: {
            type: 'boolean',
            nullable: false,
            default: false,
        },
        publishedDevicesHash: {
            type: 'text',
            nullable: true,
        },
    },
});
