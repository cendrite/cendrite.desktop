import 'reflect-metadata';
import { DataSource } from "typeorm";
import { RefreshToken } from "../Entities/RefreshToken.js";
import { User } from "../Entities/User.js";
import {FriendSchema} from "../Schemas/FriendSchema.js";
import {ConnectionIdSchema} from "../Schemas/ConnectionIdSchema.js";
import { DeviceSchema } from '../Schemas/DeviceSchema.js';

export const DatabaseContext = new DataSource({
    type: "sqlite",
    database: "./src/Electron/Persistence/Context/msg.db",
    logging: false,
    entities: [
        User,
        RefreshToken,
        DeviceSchema,
        FriendSchema,
        ConnectionIdSchema
    ],
    migrations: [],
    synchronize: true,
})

export async function initializeDatabase() {
    try {
        await DatabaseContext.initialize();
        console.log("Connected to the database");
    } catch (error) {
        console.error("Error connecting to the database", error);
    }
}