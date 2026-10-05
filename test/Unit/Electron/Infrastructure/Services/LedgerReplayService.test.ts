import { describe, expect, test } from 'vitest';
import { PrivateKey, PublicKey } from '@signalapp/libsignal-client';
import { LedgerReplayService } from '../../../../../src/Electron/Infrastructure/Services/LedgerReplayService.js';
import { IGroupKeyRepository } from '../../../../../src/Electron/Application/Contracts/Repositories/IGroupKeyRepository.js';
import { ILedgerIdentity } from '../../../../../src/Electron/Infrastructure/Interfaces/ILedgerIdentity.js';
import { GroupEpochKey } from '../../../../../src/Electron/Domain/Encryption/GroupEpochKey.js';
import {
    buildOperationSigningInput,
    buildSigningInput,
    encryptPayload,
    generateEpochKey,
    generateWriteKeyPair,
    hashEvent,
    signOuter,
} from '../../../../../src/Electron/Infrastructure/Crypto/LedgerCodec.js';
import { LedgerEventRecord } from '../../../../../src/Electron/Domain/Entities/LedgerEventRecord.js';
import { GroupMemberRef, LedgerOperation } from '../../../../../src/Electron/Domain/Operations/LedgerOperation.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { ChatPrivileges } from '../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const EPOCH = 1;

const epochKey = generateEpochKey();

const ledgerIdentity: ILedgerIdentity = {
    sign: () => Promise.reject(new Error('replay never signs')),
    publicKey: () => Promise.reject(new Error('replay never needs the local key')),
    verify: (identityKey, data, signature) => PublicKey.deserialize(identityKey).verify(data, signature),
};

function keyRepository(keys: GroupEpochKey[] = [new GroupEpochKey(GROUP_ID, EPOCH, epochKey)]): IGroupKeyRepository {
    return {
        saveWriteKey: () => Promise.resolve(),
        getWriteKey: () => Promise.resolve(null),
        saveEpochKey: () => Promise.resolve(),
        getEpochKey: (_groupId, epoch) => Promise.resolve(keys.find((k) => k.epoch === epoch) ?? null),
        getEpochKeys: () => Promise.resolve(keys),
        deleteAll: () => Promise.resolve(),
    };
}

function sut(keys?: GroupEpochKey[]): LedgerReplayService {
    return new LedgerReplayService(keyRepository(keys), ledgerIdentity);
}

class Member {
    public readonly identity = PrivateKey.generate();
    public readonly writeKey = generateWriteKeyPair();

    constructor(public readonly userTag: string, public readonly displayName: string) { }

    public get identityKey(): string {
        return Buffer.from(this.identity.getPublicKey().serialize()).toString('base64');
    }

    public get writeKeyPublic(): string {
        return this.writeKey.publicKey.toString('base64');
    }
}

class LogBuilder {
    private readonly events: LedgerEventRecord[] = [];
    private previousHash = Buffer.alloc(32);
    private version = 0;

    public add(
        author: Member,
        operation: LedgerOperation,
        options: {
            keysAdded?: string[];
            keysRemoved?: string[];
            signWith?: Member;
            encryptAtVersion?: number;
            corruptPayload?: boolean;
            previousHash?: Buffer;
            version?: number;
        } = {},
    ): this {
        const version = options.version ?? this.version + 1;
        const previousHash = options.previousHash ?? this.previousHash;
        const keysAdded = options.keysAdded ?? [];
        const keysRemoved = options.keysRemoved ?? [];

        const operationBytes = Buffer.from(JSON.stringify(operation), 'utf8');
        const signer = options.signWith ?? author;
        const innerSignature = signer.identity.sign(
            buildOperationSigningInput(GROUP_ID, version, operationBytes),
        );

        const wrapper = Buffer.from(
            JSON.stringify({
                operation: operationBytes.toString('base64'),
                identityKey: signer.identityKey,
                signature: Buffer.from(innerSignature).toString('base64'),
            }),
            'utf8',
        );

        const payload = encryptPayload(epochKey, EPOCH, GROUP_ID, options.encryptAtVersion ?? version, wrapper);
        if (options.corruptPayload) payload[payload.length - 1] ^= 0xff;

        const signingInput = buildSigningInput({
            groupId: GROUP_ID,
            version,
            previousHash,
            payload,
            keysAdded: keysAdded.map((k) => Buffer.from(k, 'base64')),
            keysRemoved: keysRemoved.map((k) => Buffer.from(k, 'base64')),
        });

        this.events.push(
            new LedgerEventRecord(
                GROUP_ID,
                version,
                previousHash,
                payload,
                author.writeKey.publicKey,
                Buffer.from(signOuter(author.writeKey.privateKey, signingInput)),
                hashEvent(signingInput),
                keysAdded,
                keysRemoved,
            ),
        );

        this.version = version;
        this.previousHash = hashEvent(signingInput);

        return this;
    }

    public build(): LedgerEventRecord[] {
        return this.events;
    }
}

function ref(member: Member, privilege: ChatPrivileges): GroupMemberRef {
    return {
        userTag: member.userTag,
        displayName: member.displayName,
        privilege,
        identityKey: member.identityKey,
        writeKeyPublic: member.writeKeyPublic,
        connectionIds: [`${member.userTag}-device`],
    };
}

/** The creator seats the whole group in one event, so the log needs no second round. */
function created(owner: Member, ...members: Member[]): LedgerOperation {
    return {
        type: LedgerOperationType.GroupCreated,
        authorTag: owner.userTag,
        at: 1,
        name: 'Trip',
        members: [ref(owner, ChatPrivileges.Owner), ...members.map((member) => ref(member, ChatPrivileges.Member))],
    };
}

function createdKeys(owner: Member, ...members: Member[]): { keysAdded: string[] } {
    return { keysAdded: [owner.writeKeyPublic, ...members.map((member) => member.writeKeyPublic)] };
}

function memberAdded(author: Member, member: Member, privilege = ChatPrivileges.Member): LedgerOperation {
    return {
        type: LedgerOperationType.MemberAdded,
        authorTag: author.userTag,
        at: 2,
        member: ref(member, privilege),
    };
}

describe('a well formed log', () => {
    test('applies every operation and tracks the head', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.halted).toBeNull();
        expect(result.stalledAt).toBeNull();
        expect(result.rejected).toEqual([]);
        expect(result.state.version).toBe(2);
        expect(result.state.name).toBe('Trip');
        expect([...result.state.members.keys()].sort()).toEqual(['alice', 'bob']);
        expect(result.state.headHash).toEqual(events[1].hash);
    });

    test('lets a member the log admitted write afterwards', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob, ChatPrivileges.Admin), { keysAdded: [bob.writeKeyPublic] })
            .add(bob, {
                type: LedgerOperationType.SettingsChanged,
                authorTag: bob.userTag,
                at: 3,
                name: 'Renamed',
                messageTtl: null,
            })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([]);
        expect(result.state.name).toBe('Renamed');
    });

    test('is deterministic', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .build();

        const first = await sut().replay(GROUP_ID, events);
        const second = await sut().replay(GROUP_ID, events);

        expect(second.state.headHash).toEqual(first.state.headHash);
        expect([...second.state.members.keys()]).toEqual([...first.state.members.keys()]);
    });

    test('removes a member and revokes their keys', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .add(
                alice,
                { type: LedgerOperationType.MemberRemoved, authorTag: alice.userTag, at: 3, userTag: bob.userTag },
                { keysRemoved: [bob.writeKeyPublic] },
            )
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([]);
        expect(result.state.members.has('bob')).toBe(false);
    });

    test('records a member published device list', async () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, {
                type: LedgerOperationType.DeviceListPublished,
                authorTag: alice.userTag,
                at: 2,
                userTag: alice.userTag,
                connectionIds: ['device-a', 'device-b'],
            })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.state.members.get('alice')!.connectionIds).toEqual(['device-a', 'device-b']);
    });
});

describe('a log the server could not have produced honestly', () => {
    test('halts when the outer signature does not verify', async () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder().add(alice, created(alice), createdKeys(alice)).build();
        events[0].payload[events[0].payload.length - 1] ^= 0xff;

        const result = await sut().replay(GROUP_ID, events);

        expect(result.halted).toEqual({ version: 1, reason: 'outer signature does not verify' });
        expect(result.state.members.size).toBe(0);
    });

    test('halts on a broken chain link', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), {
                keysAdded: [bob.writeKeyPublic],
                previousHash: Buffer.alloc(32, 0xff),
            })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.halted?.version).toBe(2);
        expect(result.halted?.reason).toBe('previous hash does not match the head');
    });

    test('halts on a version gap', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic], version: 5 })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.halted?.reason).toContain('expected version 2');
    });
});

describe('operations the log rejects but still chains', () => {
    test('rejects an unauthorised add and keeps verifying later events', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const carol = new Member('carol', 'Carol');

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .add(bob, memberAdded(bob, carol), { keysAdded: [carol.writeKeyPublic] })
            .add(alice, {
                type: LedgerOperationType.SettingsChanged,
                authorTag: alice.userTag,
                at: 4,
                name: 'Still fine',
                messageTtl: null,
            })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.halted).toBeNull();
        expect(result.rejected).toEqual([{ version: 3, reason: 'author is not an admin' }]);
        expect(result.state.members.has('carol')).toBe(false);
        expect(result.state.name).toBe('Still fine');
        expect(result.state.version).toBe(4);
    });

    test('rejects an operation signed by another identity', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .add(
                alice,
                {
                    type: LedgerOperationType.SettingsChanged,
                    authorTag: alice.userTag,
                    at: 3,
                    name: 'Hijacked',
                    messageTtl: null,
                },
                { signWith: bob },
            )
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('identity key does not match the one pinned for this member');
        expect(result.state.name).toBe('Trip');
    });

    test('rejects a device list published for someone else', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .add(alice, {
                type: LedgerOperationType.DeviceListPublished,
                authorTag: alice.userTag,
                at: 3,
                userTag: bob.userTag,
                connectionIds: ['attacker-device'],
            })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('a member may only publish their own devices');
        // Bob keeps the devices he joined with: another member cannot rewrite them.
        expect(result.state.members.get('bob')!.connectionIds).toEqual(['bob-device']);
    });

    test('rejects granting a key the operation never declared', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const mallory = new Member('mallory', 'Mallory');

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [mallory.writeKeyPublic] })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('granted keys do not match the operation');
        expect(result.state.members.has('bob')).toBe(false);
    });

    test('rejects a write key that belongs to no member', async () => {
        const alice = new Member('alice', 'Alice');
        const stranger = new Member('stranger', 'Stranger');

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(stranger, {
                type: LedgerOperationType.SettingsChanged,
                authorTag: stranger.userTag,
                at: 2,
                name: 'Nope',
                messageTtl: null,
            })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('write key does not belong to a member');
    });

    test('rejects a payload encrypted for another position', async () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder().add(alice, created(alice), { ...createdKeys(alice), encryptAtVersion: 9 }).build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('payload could not be decrypted or parsed');
    });
});

describe('a missing epoch key', () => {
    test('stalls instead of rejecting, so it can resume once the key arrives', async () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder().add(alice, created(alice), createdKeys(alice)).build();

        const result = await sut([]).replay(GROUP_ID, events);

        expect(result.stalledAt).toBe(1);
        expect(result.halted).toBeNull();
        expect(result.state.version).toBe(0);
    });
});
