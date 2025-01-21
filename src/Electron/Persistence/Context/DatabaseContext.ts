import 'reflect-metadata';
import { DataSource } from "typeorm";
import { Device } from "../Entities/Device.js";
import { RefreshToken } from "../Entities/RefreshToken.js";
import { User } from "../Entities/User.js";

export const DatabaseContext = new DataSource({
    type: "sqlite",
    database: "./src/Electron/Persistence/Context/msg.db",
    logging: false,
    entities: [
        User,
        Device,
        RefreshToken,
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