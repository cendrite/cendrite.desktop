import { EntitySchema } from 'typeorm';
import { PrivateToken } from '#electron/Domain/Entities/PrivateToken';
import { BaseSchema } from './BaseSchema.js';

export const PrivateTokenSchema = new EntitySchema<PrivateToken>({
    name: 'PrivateToken',
    target: PrivateToken,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: 'uuid',
            primary: true,
        },
        origin: {
            type: 'varchar',
            nullable: false,
        },
        token: {
            type: 'blob',
            nullable: false,
        },
    },
    indices: [{ columns: ['origin'] }],
});
