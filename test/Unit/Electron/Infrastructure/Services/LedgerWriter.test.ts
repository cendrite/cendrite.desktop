import { beforeEach, describe, expect, test } from 'vitest';
import { PrivateKey, PublicKey } from '@signalapp/libsignal-client';
import { LedgerWriter } from '../../../../../src/Electron/Infrastructure/Services/LedgerWriter.js';
import { LedgerReplayService } from '../../../../../src/Electron/Infrastructure/Services/LedgerReplayService.js';
import {
    ILedgerProvider,
    LedgerAppend,
    LedgerEvent,
    LedgerEventsPage,
    LedgerHead,
} from '../../../../../src/Electron/Application/Contracts/Providers/ILedgerProvider.js';
import { IGroupKeyRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupKeyRepository.js';
import { IGroupRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupRepository.js';
import { ILedgerSyncService } from '../../../../../src/Electron/Application/Contracts/Services/ILedgerSyncService.js';
import { ILedgerIdentity } from '../../../../../src/Electron/Infrastructure/Interfaces/ILedgerIdentity.js';
import { GroupEpochKey } from '../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';
import { GroupWriteKey } from '../../../../../src/Electron/Domain/Encryption/GroupWriteKey.js';
import { Group } from '../../../../../src/Electron/Domain/Entities/Group.js';
import { LedgerEventRecord } from '../../../../../src/Electron/Domain/Entities/LedgerEventRecord.js';
import { GroupState } from '../../../../../src/Electron/Domain/Projections/GroupState.js';
import {
    GroupCreatedOperation,
    GroupMemberRef,
    LedgerOperation,
    MemberAddedOperation,
    SettingsChangedOperation,
} from '../../../../../src/Electron/Domain/Protocol/LedgerOperation.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { ChatPrivileges } from '../../../../../src/Shared/Enums/ChatPrivileges.js';
import { ReplayResult } from '../../../../../src/Electron/Application/Contracts/Services/ILedgerReplayService.js';
import {
    buildSigningInput,
    generateEpochKey,
    generateWriteKeyPair,
    hashEvent,
} from '../../../../../src/Electron/Infrastructure/Crypto/LedgerCodec.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';
import { IPrivateTokenRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IPrivateTokenRepository.js';
import { ITokenManager } from '../../../../../src/Electron/Application/Contracts/Services/ITokenManager.js';
import { IDeviceVerifier } from '../../../../../src/Electron/Application/Contracts/Services/IDeviceVerifier.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';

const identity = PrivateKey.generate();
const writeKeyPair = generateWriteKeyPair();
const inviteKeyPair = generateWriteKeyPair();
const epochKey = generateEpochKey();

const ledgerIdentity: ILedgerIdentity = {
    sign: async (data) => Buffer.from(identity.sign(data as Uint8Array<ArrayBuffer>)),
    publicKey: async () => Buffer.from(identity.getPublicKey().serialize()),
    connectionId: async () => 'alice-device',
    verify: (key, data, signature) => PublicKey.deserialize(key).verify(data, signature),
};

const deviceVerifier: IDeviceVerifier = {
    verify: async (connectionId, signalIdentityKey) =>
        connectionId === 'alice-device' && signalIdentityKey === Buffer.from(identity.getPublicKey().serialize()).toString('base64')
            ? { userTag: 'alice', removed: false }
            : null,
};

const keyRepository: IGroupKeyRepository = {
    saveWriteKey: async () => undefined,
    getWriteKey: async () => new GroupWriteKey(GROUP_ID, writeKeyPair.publicKey, writeKeyPair.privateKey),
    saveEpochKey: async () => undefined,
    getEpochKey: async () => new GroupEpochKey(GROUP_ID, 1, epochKey),
    getEpochKeys: async () => [new GroupEpochKey(GROUP_ID, 1, epochKey)],
    deleteAll: async () => undefined,
};

class FakeProvider implements ILedgerProvider {
    public created: { payload: Buffer; writeKey: Buffer; invitesAdded: Buffer[]; signature: Buffer; privateToken: Buffer } | null = null;
    public appends: LedgerAppend[] = [];
    public conflictsLeft = 0;
    public createConflict = false;

    public async createStream(
        _groupId: string,
        payload: Buffer,
        writeKey: Buffer,
        invitesAdded: Buffer[],
        signature: Buffer,
        privateToken: Buffer,
    ) {
        this.created = { payload, writeKey, invitesAdded, signature, privateToken };
        return this.createConflict
            ? Result.fail<void>(new ErrorMessage('Conflict', 'Ledger already exists.'))
            : Result.success<void>();
    }

    public async appendEvent(_groupId: string, append: LedgerAppend) {
        this.appends.push(append);

        if (this.conflictsLeft > 0) {
            this.conflictsLeft--;
            return Result.fail<void>(new ErrorMessage('Conflict', 'Ledger is ahead.'));
        }

        return Result.success<void>();
    }

    public async archiveStream() {
        return Result.success<void>();
    }

    public async getEvents(): Promise<Result<LedgerEventsPage>> {
        return Result.success({ version: 0, archived: false, hasMore: false, events: [] as LedgerEvent[] });
    }

    public async getHead(): Promise<Result<LedgerHead>> {
        return Result.success({ version: 0, hash: Buffer.alloc(32), archived: false });
    }
}

const PRIVATE_TOKEN = Buffer.alloc(354, 0xfb);

function wallet(token: Buffer | null = PRIVATE_TOKEN): IPrivateTokenRepository & { taken: string[] } {
    const taken: string[] = [];
    return {
        taken,
        store: async () => undefined,
        count: async () => (token ? 1 : 0),
        take: async (origin: string) => {
            taken.push(origin);
            return token;
        },
        deleteAll: async () => undefined,
    };
}

function groupRepository(record: Group): IGroupRepository {
    return {
        save: async () => undefined,
        get: async () => record,
        getByLifecycle: async () => [],
        deleteAll: async () => undefined,
    };
}

function syncService(state: GroupState, onSync?: () => void): ILedgerSyncService {
    return {
        sync: async () => {
            onSync?.();
            return Result.success<ReplayResult>({ state, rejected: [], verified: [], halted: null, stalledAt: null });
        },
    };
}

function created(): LedgerOperation {
    return new GroupCreatedOperation('alice', 'Trip', [
        new GroupMemberRef(
            'alice',
            'Alice',
            ChatPrivileges.Owner,
            null,
            [writeKeyPair.publicKey.toString('base64')],
            [],
            ['alice-device'],
        ),
        new GroupMemberRef(
            'bob',
            'Bob',
            ChatPrivileges.Member,
            null,
            [],
            [inviteKeyPair.publicKey.toString('base64')],
            ['bob-device'],
        ),
    ]);
}

function tokenManager(onRefresh: () => void = () => undefined): ITokenManager & { refreshes: number } {
    const manager = {
        refreshes: 0,
        init: async () => undefined,
        refreshTokens: async () => {
            manager.refreshes++;
            onRefresh();
        },
        disableAndClear: () => undefined,
    };
    return manager;
}

async function create(sut: LedgerWriter) {
    const sealed = await sut.sealCreate(GROUP_ID, [inviteKeyPair.publicKey], created());
    return sut.createStream(GROUP_ID, [inviteKeyPair.publicKey], sealed.data!);
}

function settingsChanged(): LedgerOperation {
    return new SettingsChangedOperation('alice', 'Renamed', null);
}

let provider: FakeProvider;

beforeEach(() => {
    provider = new FakeProvider();
});

describe('creating a stream', () => {
    test('produces an event that this client can replay back', async () => {
        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID)),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        const result = await create(sut);

        expect(result.success).toBe(true);

        const { payload, writeKey, signature, invitesAdded } = provider.created!;

        expect(invitesAdded).toEqual([inviteKeyPair.publicKey]);

        const signingInput = buildSigningInput({
            groupId: GROUP_ID,
            version: 1,
            previousHash: Buffer.alloc(32),
            payload,
            invitesAdded,
        });

        const record = new LedgerEventRecord(
            GROUP_ID,
            1,
            Buffer.alloc(32),
            payload,
            writeKey,
            signature,
            hashEvent(signingInput),
            [],
            invitesAdded.map((key) => key.toString('base64')),
        );

        const replayed = await new LedgerReplayService(keyRepository, ledgerIdentity, deviceVerifier).replay(GROUP_ID, [record]);

        expect(replayed.halted).toBeNull();
        expect(replayed.rejected).toEqual([]);
        expect(replayed.state.name).toBe('Trip');
        expect(replayed.state.members.get('alice')!.writeKeys).toEqual([writeKeyPair.publicKey.toString('base64')]);
        expect(replayed.state.members.get('bob')!.inviteKeys).toEqual([inviteKeyPair.publicKey.toString('base64')]);
    });

    test('signs with the group write key, not the identity key', async () => {
        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID)),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        await create(sut);

        expect(provider.created!.writeKey).toEqual(writeKeyPair.publicKey);
        expect(provider.created!.signature).toHaveLength(64);
    });

    test('redeems a private token for the ledger', async () => {
        const tokens = wallet();
        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID)),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            tokens,
            tokenManager(),
        );

        await create(sut);

        expect(tokens.taken).toEqual(['ledger']);
        expect(provider.created!.privateToken).toEqual(PRIVATE_TOKEN);
    });

    test('fails without calling the ledger when the wallet is empty', async () => {
        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID)),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            wallet(null),
            tokenManager(),
        );

        const result = await create(sut);

        expect(result.success).toBe(false);
        expect(result.errorMessage?.message).toContain('No private token');
        expect(provider.created).toBeNull();
    });

    test('refills the wallet once when it is empty, then creates', async () => {
        let token: Buffer | null = null;
        const tokens = { ...wallet(), take: async () => { const taken = token; token = null; return taken; } };
        const manager = tokenManager(() => { token = PRIVATE_TOKEN; });

        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID)),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            tokens,
            manager,
        );

        const result = await create(sut);

        expect(result.success).toBe(true);
        expect(manager.refreshes).toBe(1);
        expect(provider.created!.privateToken).toEqual(PRIVATE_TOKEN);
    });

    test('treats a conflict as created when the stream head is this create', async () => {
        provider.createConflict = true;
        const state = new GroupState(GROUP_ID);

        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID)),
            syncService(state),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        const sealed = await sut.sealCreate(GROUP_ID, [inviteKeyPair.publicKey], created());
        state.version = 1;
        state.headHash = sealed.data!.hash;

        const result = await sut.createStream(GROUP_ID, [inviteKeyPair.publicKey], sealed.data!);

        expect(result.success).toBe(true);
    });

    test('keeps a conflict when the existing stream is not this create', async () => {
        provider.createConflict = true;
        const state = new GroupState(GROUP_ID);
        state.version = 1;
        state.headHash = Buffer.alloc(32, 0x99);

        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID)),
            syncService(state),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        const result = await create(sut);

        expect(result.success).toBe(false);
        expect(result.errorMessage?.code).toBe('Conflict');
    });
});

describe('appending', () => {
    test('builds the event against the current head', async () => {
        const head = Buffer.alloc(32, 0x5a);
        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID, 0, 4, head)),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        await sut.append(GROUP_ID, settingsChanged());

        expect(provider.appends).toHaveLength(1);
        expect(provider.appends[0].expectedVersion).toBe(4);
        expect(provider.appends[0].previousHash).toEqual(head);
    });

    test('syncs before every attempt, so it never signs against a stale head', async () => {
        let syncs = 0;
        provider.conflictsLeft = 2;

        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID, 0, 1, Buffer.alloc(32, 0x11))),
            syncService(new GroupState(GROUP_ID), () => syncs++),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        const result = await sut.append(GROUP_ID, settingsChanged());

        expect(result.success).toBe(true);
        expect(provider.appends).toHaveLength(3);
        expect(syncs).toBe(3);
    });

    test('gives up rather than looping forever on conflicts', async () => {
        provider.conflictsLeft = 99;

        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID, 0, 1, Buffer.alloc(32, 0x11))),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        const result = await sut.append(GROUP_ID, settingsChanged());

        expect(result.success).toBe(false);
        expect(provider.appends).toHaveLength(5);
    });

    test('declares the removed member write and invite keys the reducer expects', async () => {
        const state = new GroupState(GROUP_ID);
        state.members.set('bob', {
            userTag: 'bob',
            displayName: 'Bob',
            privilege: ChatPrivileges.Member,
            identityKey: 'bob-identity',
            joinedAtVersion: 2,
            writeKeys: [Buffer.alloc(32, 0xb2).toString('base64')],
            inviteKeys: [Buffer.alloc(32, 0xd4).toString('base64')],
            connectionIds: [],
        });

        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID, 0, 2, Buffer.alloc(32, 0x11))),
            syncService(state),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        await sut.append(GROUP_ID, {
            type: LedgerOperationType.MemberRemoved,
            authorTag: 'alice',
            at: 3,
            userTag: 'bob',
        });

        expect(provider.appends[0].keysRemoved).toEqual([Buffer.alloc(32, 0xb2), Buffer.alloc(32, 0xd4)]);
        expect(provider.appends[0].keysAdded).toEqual([]);
        expect(provider.appends[0].invitesAdded).toEqual([]);
    });

    test('declares a new member\'s invite keys as invites', async () => {
        const sut = new LedgerWriter(
            provider,
            keyRepository,
            groupRepository(new Group(GROUP_ID, 0, 1, Buffer.alloc(32, 0x11))),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        await sut.append(
            GROUP_ID,
            new MemberAddedOperation(
                'alice',
                new GroupMemberRef('bob', 'Bob', ChatPrivileges.Member, null, [], [Buffer.alloc(32, 0xd4).toString('base64')], []),
            ),
        );

        expect(provider.appends[0].invitesAdded).toEqual([Buffer.alloc(32, 0xd4)]);
        expect(provider.appends[0].keysAdded).toEqual([]);
        expect(provider.appends[0].keysRemoved).toEqual([]);
    });

    test('fails when the group has no write key', async () => {
        const sut = new LedgerWriter(
            provider,
            { ...keyRepository, getWriteKey: async () => null },
            groupRepository(new Group(GROUP_ID, 0, 1, Buffer.alloc(32, 0x11))),
            syncService(new GroupState(GROUP_ID)),
            ledgerIdentity,
            wallet(),
            tokenManager(),
        );

        const result = await sut.append(GROUP_ID, settingsChanged());

        expect(result.success).toBe(false);
        expect(result.errorMessage?.message).toContain('No write key');
    });
});
