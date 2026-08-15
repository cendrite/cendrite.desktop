import { EntitySchema } from "typeorm/entity-schema/EntitySchema.js";
import { PumpEvent } from "../../Models/PumpEvent.js";

export const EventSchema = new EntitySchema<PumpEvent>({
    name: 'Event',
    target: Event,
    columns: {
        id: {
            type: 'integer',
            primary: true,
            generated: 'increment',
        },
        type: {
            type: 'varchar',
            nullable: false,
        },
        content: {
            type: 'text',
            nullable: false,
        },
        occuredOn: {
            type: 'timestamp',
            nullable: false,
        },
        processedOn: {
            type: 'timestamp',
            nullable: true,
        },
        error: {
            type: 'text',
            nullable: true,
        },
    },
})
