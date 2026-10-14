import { EntitySchema } from "typeorm/entity-schema/EntitySchema.js";
import { OutboxEvent } from "#electron/Infrastructure/Models/OutboxEvent";

export const OutboxEventSchema = new EntitySchema<OutboxEvent>({
    name: 'outbox_event',
    target: OutboxEvent,
    columns: {
        id: {
            type: 'varchar',
            primary: true,
        },
        type: {
            type: 'varchar',
            nullable: false,
        },
        content: {
            type: 'json',
            nullable: false,
        },
        occurredOn: {
            type: 'datetime',
            default: () => "datetime('now')",
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value),
            },
            nullable: false,
        },
        processedOn: {
            type: 'datetime',
            default: () => "datetime('now')",
            transformer: {
                to: (value: Date) => value,
                from: (value: string) => new Date(value),
            },
            nullable: true,
        },
        error: {
            type: 'text',
            nullable: true,
        },
    },
})
