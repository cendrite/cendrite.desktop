import { EntitySchema } from 'typeorm';
import { LedgerEventRecord } from '#electron/Domain/Entities/LedgerEventRecord';
import { BaseSchema } from './BaseSchema.js';

export const LedgerEventRecordSchema = new EntitySchema<LedgerEventRecord>({
    name: 'LedgerEventRecord',
    target: LedgerEventRecord,
    columns: {
        ...BaseSchema.columns,
        groupId: {
            type: 'uuid',
            primary: true,
        },
        version: {
            type: 'integer',
            primary: true,
        },
        previousHash: {
            type: 'blob',
            nullable: false,
        },
        payload: {
            type: 'blob',
            nullable: false,
        },
        writeKeyPublic: {
            type: 'blob',
            nullable: false,
        },
        signature: {
            type: 'blob',
            nullable: false,
        },
        keysAdded: {
            type: 'simple-json',
            nullable: false,
        },
        keysRemoved: {
            type: 'simple-json',
            nullable: false,
        },
        hash: {
            type: 'blob',
            nullable: false,
        },
        status: {
            type: 'integer',
            nullable: false,
        },
        rejectReason: {
            type: 'text',
            nullable: true,
        },
    },
});
