import 'reflect-metadata';
import { DataSource } from "typeorm";
import { FriendSchema } from "../Schemas/FriendSchema.js";
import { ConnectionIdSchema } from "../Schemas/ConnectionIdSchema.js";
import { DeviceSchema } from "../Schemas/DeviceSchema.js";
import { RefreshTokenSchema } from "../Schemas/RefreshTokenSchema.js";
import { UserSchema } from "../Schemas/UserSchema.js";

let dbContext: DataSource;

export async function initializeDatabase(dbPath: string | null = null): Promise<DataSource> {
    const finalDbPath = dbPath ? dbPath : "./src/Electron/Persistence/Context/msg.db";

    const newDbContext = new DataSource({
        type: "sqlite",
        database: finalDbPath,
        logging: false,
        entities: [
            UserSchema,
            RefreshTokenSchema,
            DeviceSchema,
            FriendSchema,
            ConnectionIdSchema
        ],
        migrations: [],
        synchronize: true,
    });
    try {
        await newDbContext.initialize();
        dbContext = newDbContext;
        console.log("Connected to the database at:", finalDbPath);
        return dbContext;
    } catch (error) {
        console.error("Error connecting to the database", error);
        throw error;
    }
}

export function getDbContext(): DataSource {
    if (!dbContext) {
        throw new Error("Database context not initialized");
    }
    return dbContext;
}
