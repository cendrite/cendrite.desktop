import {EntitySchemaColumnOptions} from "typeorm";

export const BaseSchema = {
    columns: {
        createdAt: {
            type: "datetime",
            default: () => "datetime('now')",
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value)
            },
        } as EntitySchemaColumnOptions,
        updatedAt: {
            type: "datetime",
            nullable: true,
            default: () => "datetime('now')",
            onUpdate: "datetime('now')",
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value)
            }
        } as EntitySchemaColumnOptions,
    }
}