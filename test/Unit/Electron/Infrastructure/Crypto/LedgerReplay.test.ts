import { describe, expect, test } from 'vitest';
import { PrivateKey, PublicKey } from '@signalapp/libsignal-client';
import { replay, ReplayDependencies } from '../../../../../src/Electron/Infrastructure/Crypto/LedgerReplay.js';
import {
    buildOperationSigningInput,
    buildSigningInput,
    encryptPayload,
    generateEpochKey,
    generateWriteKeyPair,
    hashEvent,
    signOuter,
} from '../../../../../src/Electron/Infrastructure/Crypto/LedgerCodec.js';
import { LedgerEventRecord } from '../../../../../src/Electron/Domain/Ledger/LedgerEventRecord.js';
import { LedgerOperation } from '../../../../../src/Electron/Domain/Ledger/LedgerOperation.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Ledger/LedgerOperationType.js';
import { ChatPrivileges } from '../../../../../src/Electron/Domain/Enums/ChatPrivileges.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const EPOCH = 1;

const epochKey = generateEpochKey();

const deps: ReplayDependencies = {
    epochKey: (epoch) => (epoch === EPOCH ? epochKey : null),
    verifyIdentitySignature: (identityKey, data, signature) =>
        PublicKey.deserialize(identityKey).verify(data, signature),
};

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

function created(owner: Member): LedgerOperation {
    return {
        type: LedgerOperationType.GroupCreated,
        authorTag: owner.userTag,
        at: 1,
        name: 'Trip',
        owner: {
            userTag: owner.userTag,
            displayName: owner.displayName,
            privilege: ChatPrivileges.Owner,
            identityKey: owner.identityKey,
        },
    };
}

function memberAdded(author: Member, member: Member, privilege = ChatPrivileges.Member): LedgerOperation {
    return {
        type: LedgerOperationType.MemberAdded,
        authorTag: author.userTag,
        at: 2,
        member: {
            userTag: member.userTag,
            displayName: member.displayName,
            privilege,
            identityKey: member.identityKey,
        },
        writeKeyPublic: member.writeKeyPublic,
    };
}

describe('a well formed log', () => {
    test('applies every operation and tracks the head', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.halted).toBeNull();
        expect(result.stalledAt).toBeNull();
        expect(result.rejected).toEqual([]);
        expect(result.state.version).toBe(2);
        expect(result.state.name).toBe('Trip');
        expect([...result.state.members.keys()].sort()).toEqual(['alice', 'bob']);
        expect(result.state.headHash).toEqual(events[1].hash);
    });

    test('lets a member the log admitted write afterwards', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob, ChatPrivileges.Admin), { keysAdded: [bob.writeKeyPublic] })
            .add(bob, {
                type: LedgerOperationType.SettingsChanged,
                authorTag: bob.userTag,
                at: 3,
                name: 'Renamed',
                messageTtl: null,
            })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.rejected).toEqual([]);
        expect(result.state.name).toBe('Renamed');
    });

    test('is deterministic', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .build();

        const first = replay(GROUP_ID, events, deps);
        const second = replay(GROUP_ID, events, deps);

        expect(second.state.headHash).toEqual(first.state.headHash);
        expect([...second.state.members.keys()]).toEqual([...first.state.members.keys()]);
    });

    test('removes a member and revokes their keys', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .add(
                alice,
                { type: LedgerOperationType.MemberRemoved, authorTag: alice.userTag, at: 3, userTag: bob.userTag },
                { keysRemoved: [bob.writeKeyPublic] },
            )
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.rejected).toEqual([]);
        expect(result.state.members.has('bob')).toBe(false);
    });

    test('records a member published device list', () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, {
                type: LedgerOperationType.DeviceListPublished,
                authorTag: alice.userTag,
                at: 2,
                userTag: alice.userTag,
                connectionIds: ['device-a', 'device-b'],
            })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.state.members.get('alice')!.connectionIds).toEqual(['device-a', 'device-b']);
    });
});

describe('a log the server could not have produced honestly', () => {
    test('halts when the outer signature does not verify', () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder().add(alice, created(alice)).build();
        events[0].payload[events[0].payload.length - 1] ^= 0xff;

        const result = replay(GROUP_ID, events, deps);

        expect(result.halted).toEqual({ version: 1, reason: 'outer signature does not verify' });
        expect(result.state.members.size).toBe(0);
    });

    test('halts on a broken chain link', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob), {
                keysAdded: [bob.writeKeyPublic],
                previousHash: Buffer.alloc(32, 0xff),
            })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.halted?.version).toBe(2);
        expect(result.halted?.reason).toBe('previous hash does not match the head');
    });

    test('halts on a version gap', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic], version: 5 })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.halted?.reason).toContain('expected version 2');
    });
});

describe('operations the log rejects but still chains', () => {
    test('rejects an unauthorised add and keeps verifying later events', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const carol = new Member('carol', 'Carol');

        const events = new LogBuilder()
            .add(alice, created(alice))
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

        const result = replay(GROUP_ID, events, deps);

        expect(result.halted).toBeNull();
        expect(result.rejected).toEqual([{ version: 3, reason: 'author is not an admin' }]);
        expect(result.state.members.has('carol')).toBe(false);
        expect(result.state.name).toBe('Still fine');
        expect(result.state.version).toBe(4);
    });

    test('rejects an operation signed by another identity', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
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

        const result = replay(GROUP_ID, events, deps);

        expect(result.rejected[0].reason).toBe('identity key does not match the one pinned for this member');
        expect(result.state.name).toBe('Trip');
    });

    test('rejects a device list published for someone else', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [bob.writeKeyPublic] })
            .add(alice, {
                type: LedgerOperationType.DeviceListPublished,
                authorTag: alice.userTag,
                at: 3,
                userTag: bob.userTag,
                connectionIds: ['attacker-device'],
            })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.rejected[0].reason).toBe('a member may only publish their own devices');
        expect(result.state.members.get('bob')!.connectionIds).toEqual([]);
    });

    test('rejects granting a key the operation never declared', () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const mallory = new Member('mallory', 'Mallory');

        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(alice, memberAdded(alice, bob), { keysAdded: [mallory.writeKeyPublic] })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.rejected[0].reason).toBe('granted keys do not match the operation');
        expect(result.state.members.has('bob')).toBe(false);
    });

    test('rejects a write key that belongs to no member', () => {
        const alice = new Member('alice', 'Alice');
        const stranger = new Member('stranger', 'Stranger');

        const events = new LogBuilder()
            .add(alice, created(alice))
            .add(stranger, {
                type: LedgerOperationType.SettingsChanged,
                authorTag: stranger.userTag,
                at: 2,
                name: 'Nope',
                messageTtl: null,
            })
            .build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.rejected[0].reason).toBe('write key does not belong to a member');
    });

    test('rejects a payload encrypted for another position', () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder().add(alice, created(alice), { encryptAtVersion: 9 }).build();

        const result = replay(GROUP_ID, events, deps);

        expect(result.rejected[0].reason).toBe('payload could not be decrypted or parsed');
    });
});

describe('a missing epoch key', () => {
    test('stalls instead of rejecting, so it can resume once the key arrives', () => {
        const alice = new Member('alice', 'Alice');
        const events = new LogBuilder().add(alice, created(alice)).build();

        const result = replay(GROUP_ID, events, { ...deps, epochKey: () => null });

        expect(result.stalledAt).toBe(1);
        expect(result.halted).toBeNull();
        expect(result.state.version).toBe(0);
    });
});
