import {EntitySchemaColumnOptions} from "typeorm";

export const BaseSchema = {
    columns: {
        createdAt: {
            type: "datetime",
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value)
            },
        } as EntitySchemaColumnOptions,
        updatedAt: {
            type: "text",
            nullable: true,
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value)
            }
        } as EntitySchemaColumnOptions,
    }
}