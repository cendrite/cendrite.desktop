import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { FriendSchema } from '../Schemas/FriendSchema.js';
import { FriendConnectionIdSchema } from '../Schemas/FriendConnectionIdSchema.js';
import { DeviceSchema } from '../Schemas/DeviceSchema.js';
import { RefreshTokenSchema } from '../Schemas/RefreshTokenSchema.js';
import { UserSchema } from '../Schemas/UserSchema.js';
import { ChatSchema } from '../Schemas/ChatSchema.js';
import { ChatMemberSchema } from '../Schemas/ChatMemberSchema.js';
import { MessageSchema } from '../Schemas/MessageSchema.js';
import { UserConnectionIdSchema } from '../Schemas/UserConnectionIdSchema.js';
import { EcPreKeySchema } from '../Schemas/EcPreKeySchema.js';
import { IdentityKeysSchema } from '../Schemas/IdentityKeysSchema.js';
import { IdentityCacheSchema } from '../Schemas/IdentityCacheSchema.js';
import { SignedPreKeySchema } from '../Schemas/SignedPreKeySchema.js';
import { SessionRecordSchema } from '../Schemas/SessionRecordSchema.js';
import { GroupEpochKeySchema } from '../Schemas/GroupEpochKeySchema.js';
import { GroupWriteKeySchema } from '../Schemas/GroupWriteKeySchema.js';
import { LedgerEventRecordSchema } from '../Schemas/LedgerEventRecordSchema.js';
import { GroupRecordSchema } from '../Schemas/GroupRecordSchema.js';
import { MessageMediaSchema } from '../Schemas/MessageMediaSchema.js';
import { OutboxEventSchema } from '../Schemas/OutboxEventSchema.js';
import { KyberPreKeySchema } from '../Schemas/KyberPreKeySchema.js';
import { AppearanceSettingsSchema } from '../Schemas/AppearanceSettingsSchema.js';

let dbContext: DataSource;

export async function initializeDatabase(dbPath: string | null = null): Promise<DataSource> {
    const finalDbPath = dbPath ? dbPath : './src/Electron/Persistence/Context/msg.db';

    const newDbContext = new DataSource({
        type: 'sqlite',
        database: finalDbPath,
        logging: false,
        entities: [
            UserSchema,
            UserConnectionIdSchema,
            RefreshTokenSchema,
            DeviceSchema,
            FriendSchema,
            FriendConnectionIdSchema,
            ChatSchema,
            ChatMemberSchema,
            MessageSchema,
            MessageMediaSchema,
            EcPreKeySchema,
            SessionRecordSchema,
            IdentityKeysSchema,
            IdentityCacheSchema,
            SignedPreKeySchema,
            KyberPreKeySchema,
            OutboxEventSchema,
            AppearanceSettingsSchema,
            GroupEpochKeySchema,
            GroupWriteKeySchema,
            LedgerEventRecordSchema,
            GroupRecordSchema
        ],
        migrations: [],
        synchronize: true,
    });
    try {
        await newDbContext.initialize();
        dbContext = newDbContext;
        console.log('Connected to the database at:', finalDbPath);
        return dbContext;
    } catch (error) {
        console.error('Error connecting to the database', error);
        throw error;
    }
}

export function getDbContext(): DataSource {
    if (!dbContext) {
        throw new Error('Database context not initialized');
    }
    return dbContext;
}
