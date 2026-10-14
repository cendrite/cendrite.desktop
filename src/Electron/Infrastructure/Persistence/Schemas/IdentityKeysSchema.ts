import { EntitySchema } from 'typeorm';
import { IdentityKeys } from '#electron/Domain/Encryption/IdentityKeys';
import { BaseSchema } from './BaseSchema.js';

export const IdentityKeysSchema = new EntitySchema<IdentityKeys>({
    name: 'IdentityKeys',
    target: IdentityKeys,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: Number,
            primary: true,
        },
        registrationId: {
            type: Number,
            unique: true,
        },
        identityKeyPublic: {
            type: 'blob',
        },
        identityKeyPrivate: {
            type: 'blob',
        },
    },
});
