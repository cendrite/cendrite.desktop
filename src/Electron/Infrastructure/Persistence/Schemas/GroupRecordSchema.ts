import { EntitySchema } from 'typeorm';
import { BaseSchema } from './BaseSchema.js';
import { Group } from '#electron/Domain/Entities/Group';

export const GroupRecordSchema = new EntitySchema<Group>({
    name: 'GroupRecord',
    target: Group,
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
