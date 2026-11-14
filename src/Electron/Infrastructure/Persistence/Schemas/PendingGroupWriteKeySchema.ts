import { EntitySchema } from 'typeorm';
import { PendingGroupWriteKey } from '#electron/Domain/Encryption/PendingGroupWriteKey';
import { BaseSchema } from './BaseSchema.js';

export const PendingGroupWriteKeySchema = new EntitySchema<PendingGroupWriteKey>({
    name: 'PendingGroupWriteKey',
    target: PendingGroupWriteKey,
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
