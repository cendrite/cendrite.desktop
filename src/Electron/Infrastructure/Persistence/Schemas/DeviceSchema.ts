import {EntitySchema} from "typeorm";
import {BaseSchema} from "./BaseSchema.js";
import {Device} from "#electron/Domain/Entities/Device";

export const DeviceSchema = new EntitySchema<Device>({
    name: "Device",
    target: Device,
    columns: {
        ...BaseSchema.columns,
        id: {
            type: "uuid",
            primary: true,
            generated: 'uuid'
        },
        connectionId: {
            type: "uuid",
            unique: true
        },
        privateKey: {
            type: "text",
            unique: true
        },
        publicKey: {
            type: "text",
            unique: true
        }
    }
});