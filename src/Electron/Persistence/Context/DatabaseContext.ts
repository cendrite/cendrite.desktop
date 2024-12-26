import { DataSource } from "typeorm";
import 'reflect-metadata';
import { Device } from "../Entities/Device.js";

export const DatabaseContext = new DataSource({
    type: "sqlite",
    database: "./src/Electron/Persistence/Context/msg.db",
    logging: false,
    entities: [
        Device,
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