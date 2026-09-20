import { EntitySchema } from 'typeorm';
import { BaseSchema } from '../BaseSchema.js';
import { SettingsRecord } from '../../../../Domain/Entities/Settings/SettingsRecord.js';

export function createSettingsSchema<T extends SettingsRecord>(
    name: string,
    tableName: string,
    target: new () => T,
): EntitySchema<T> {
    return new EntitySchema<T>({
        name: name,
        tableName: tableName,
        target: target,
        columns: {
            ...BaseSchema.columns,
            id: {
                primary: true,
                type: 'uuid',
                generated: 'uuid',
            },
            value: {
                type: 'text',
            },
        },
    });
}
