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
import {
    GroupCreatedOperation,
    GroupMemberRef,
    LedgerOperation,
    MemberAddedOperation,
} from '../../../../../src/Electron/Domain/Protocol/LedgerOperation.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { ChatPrivileges } from '../../../../../src/Shared/Enums/ChatPrivileges.js';
import { IDeviceVerifier } from '../../../../../src/Electron/Application/Contracts/Services/IDeviceVerifier.js';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const EPOCH = 1;

const epochKey = generateEpochKey();

const ledgerIdentity: ILedgerIdentity = {
    sign: () => Promise.reject(new Error('replay never signs')),
    publicKey: () => Promise.reject(new Error('replay never needs the local key')),
    connectionId: () => Promise.reject(new Error('replay never needs the local device')),
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

const devices = new Map<string, string>();
const removedDevices = new Set<string>();

const deviceVerifier: IDeviceVerifier = {
    verify: async (connectionId, signalIdentityKey) => {
        const userTag = devices.get(`${connectionId}:${signalIdentityKey}`);
        return userTag ? { userTag, removed: removedDevices.has(connectionId) } : null;
    },
};

function sut(keys?: GroupEpochKey[], verifier: IDeviceVerifier = deviceVerifier): LedgerReplayService {
    return new LedgerReplayService(keyRepository(keys), ledgerIdentity, verifier);
}

class Device {
    public readonly identity = PrivateKey.generate();

    constructor(public readonly connectionId: string, userTag: string | null) {
        if (userTag) devices.set(`${connectionId}:${this.identityKey}`, userTag);
    }

    public get identityKey(): string {
        return Buffer.from(this.identity.getPublicKey().serialize()).toString('base64');
    }
}

class Member {
    public readonly device: Device;
    public readonly writeKey = generateWriteKeyPair();

    constructor(public readonly userTag: string, public readonly displayName: string) {
        this.device = new Device(`${userTag}-device`, userTag);
    }

    public addDevice(name: string): Device {
        return new Device(`${this.userTag}-${name}`, this.userTag);
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
            invitesAdded?: string[];
            keysRemoved?: string[];
            signWith?: Member;
            signFrom?: Device;
            encryptAtVersion?: number;
            corruptPayload?: boolean;
            previousHash?: Buffer;
            version?: number;
        } = {},
    ): this {
        const version = options.version ?? this.version + 1;
        const previousHash = options.previousHash ?? this.previousHash;
        const keysAdded = options.keysAdded ?? [];
        const invitesAdded = options.invitesAdded ?? [];
        const keysRemoved = options.keysRemoved ?? [];

        const operationBytes = Buffer.from(JSON.stringify(operation), 'utf8');
        const signer = options.signFrom ?? (options.signWith ?? author).device;
        const innerSignature = signer.identity.sign(
            buildOperationSigningInput(GROUP_ID, version, operationBytes),
        );

        const wrapper = Buffer.from(
            JSON.stringify({
                operation: operationBytes.toString('base64'),
                identityKey: signer.identityKey,
                signature: Buffer.from(innerSignature).toString('base64'),
                connectionId: signer.connectionId,
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
            invitesAdded: invitesAdded.map((k) => Buffer.from(k, 'base64')),
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
                invitesAdded,
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

function ref(member: Member, privilege: ChatPrivileges, invited = true): GroupMemberRef {
    return new GroupMemberRef(
        member.userTag,
        member.displayName,
        privilege,
        null,
        invited ? [] : [member.writeKeyPublic],
        invited ? [member.writeKeyPublic] : [],
        [`${member.userTag}-device`],
    );
}

function created(owner: Member, ...members: Member[]): LedgerOperation {
    return new GroupCreatedOperation(owner.userTag, 'Trip', [
        ref(owner, ChatPrivileges.Owner, false),
        ...members.map((member) => ref(member, ChatPrivileges.Member)),
    ]);
}

function createdKeys(_owner: Member, ...members: Member[]): { invitesAdded: string[] } {
    return { invitesAdded: members.map((member) => member.writeKeyPublic) };
}

function memberAdded(author: Member, member: Member, privilege = ChatPrivileges.Member): LedgerOperation {
    return new MemberAddedOperation(author.userTag, ref(member, privilege));
}

describe('a well formed log', () => {
    test('applies every operation and tracks the head', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { invitesAdded: [bob.writeKeyPublic] })
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

    test('refuses operations from a member who only holds an invite key', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob, ChatPrivileges.Admin), { invitesAdded: [bob.writeKeyPublic] })
            .add(bob, {
                type: LedgerOperationType.SettingsChanged,
                authorTag: bob.userTag,
                at: 3,
                name: 'Renamed',
                messageTtl: null,
            })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([{ version: 3, reason: 'an invite key may only register a write key' }]);
        expect(result.state.name).toBe('Trip');
    });

    test('seats invitees with invite keys only', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder().add(alice, created(alice, bob), createdKeys(alice, bob)).build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([]);
        expect(result.state.members.get('alice')!.writeKeys).toEqual([alice.writeKeyPublic]);
        expect(result.state.members.get('bob')!.writeKeys).toEqual([]);
        expect(result.state.members.get('bob')!.inviteKeys).toEqual([bob.writeKeyPublic]);
    });

    test('is deterministic', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { invitesAdded: [bob.writeKeyPublic] })
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
            .add(alice, memberAdded(alice, bob), { invitesAdded: [bob.writeKeyPublic] })
            .add(
                alice,
                { type: LedgerOperationType.MemberRemoved, authorTag: alice.userTag, at: 3, userTag: bob.userTag },
                { keysRemoved: [bob.writeKeyPublic] },
            )
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([]);
        expect(result.state.members.has('bob')).toBe(false);
        expect(result.state.ownerOfWriteKey(bob.writeKeyPublic)).toBeNull();
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
                invitesAdded: [bob.writeKeyPublic],
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
            .add(alice, memberAdded(alice, bob), { invitesAdded: [bob.writeKeyPublic], version: 5 })
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
            .add(alice, memberAdded(alice, bob), { invitesAdded: [bob.writeKeyPublic] })
            .add(bob, memberAdded(bob, carol), { invitesAdded: [carol.writeKeyPublic] })
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
        expect(result.rejected).toEqual([{ version: 3, reason: 'an invite key may only register a write key' }]);
        expect(result.state.members.has('carol')).toBe(false);
        expect(result.state.name).toBe('Still fine');
        expect(result.state.version).toBe(4);
    });

    test('rejects an operation signed by another identity', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { invitesAdded: [bob.writeKeyPublic] })
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

        expect(result.rejected[0].reason).toBe('the signing device does not belong to the author');
        expect(result.state.name).toBe('Trip');
    });

    test('rejects a device list published for someone else', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { invitesAdded: [bob.writeKeyPublic] })
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
        expect(result.state.members.get('bob')!.connectionIds).toEqual([]);
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

    test('rejects inviting a key the operation never declared', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const mallory = new Member('mallory', 'Mallory');

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, memberAdded(alice, bob), { invitesAdded: [mallory.writeKeyPublic] })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('invited keys do not match the operation');
        expect(result.state.members.has('bob')).toBe(false);
    });

    test('rejects a new member who is handed a write key instead of an invite key', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, new MemberAddedOperation(alice.userTag, ref(bob, ChatPrivileges.Member, false)))
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('a new member may only be given invite keys');
        expect(result.state.members.has('bob')).toBe(false);
    });

    test('rejects a creation that hands an invitee a write key', async () => {
        const alice = new Member('alice', 'Alice');
        const bob = new Member('bob', 'Bob');
        const operation = new GroupCreatedOperation(alice.userTag, 'Trip', [
            ref(alice, ChatPrivileges.Owner, false),
            ref(bob, ChatPrivileges.Member, false),
        ]);

        const events = new LogBuilder().add(alice, operation).build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('only the creating write key may be a write key at creation');
        expect(result.state.members.size).toBe(0);
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

describe('authors verified through their device chain', () => {
    const renamed = (author: Member, at: number) => ({
        type: LedgerOperationType.SettingsChanged as const,
        authorTag: author.userTag,
        at,
        name: 'Renamed',
        messageTtl: null,
    });

    test('accepts an operation signed from another of the author\'s devices', async () => {
        const alice = new Member('alice', 'Alice');
        const phone = alice.addDevice('phone');

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, renamed(alice, 2), { signFrom: phone })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([]);
        expect(result.state.name).toBe('Renamed');
    });

    test('accepts an operation signed by a device the author has since removed', async () => {
        const alice = new Member('alice', 'Alice');
        const tablet = alice.addDevice('tablet');
        removedDevices.add(tablet.connectionId);

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, renamed(alice, 2), { signFrom: tablet })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([]);
        expect(result.state.name).toBe('Renamed');
    });

    test('rejects an operation signed by a device whose chain does not verify', async () => {
        const alice = new Member('alice', 'Alice');
        const unknown = new Device('alice-unknown', null);

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, renamed(alice, 2), { signFrom: unknown })
            .build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected).toEqual([{ version: 2, reason: 'the signing device does not belong to the author' }]);
        expect(result.state.name).toBe('Trip');
    });

    test('rejects a creation signed by a device of someone else', async () => {
        const alice = new Member('alice', 'Alice');
        const mallory = new Member('mallory', 'Mallory');

        const events = new LogBuilder().add(alice, created(alice), { ...createdKeys(alice), signWith: mallory }).build();

        const result = await sut().replay(GROUP_ID, events);

        expect(result.rejected[0].reason).toBe('the signing device does not belong to the author');
        expect(result.state.members.size).toBe(0);
    });

    test('stalls instead of rejecting when a device chain cannot be fetched', async () => {
        const alice = new Member('alice', 'Alice');
        const offline: IDeviceVerifier = {
            verify: async (connectionId, signalIdentityKey) => {
                if (connectionId === 'alice-phone') throw new Error('offline');
                return deviceVerifier.verify(connectionId, signalIdentityKey);
            },
        };

        const events = new LogBuilder()
            .add(alice, created(alice), createdKeys(alice))
            .add(alice, renamed(alice, 2), { signFrom: alice.addDevice('phone') })
            .build();

        const result = await sut(undefined, offline).replay(GROUP_ID, events);

        expect(result.stalledAt).toBe(2);
        expect(result.rejected).toEqual([]);
        expect(result.state.version).toBe(1);
        expect(result.state.members.has('alice')).toBe(true);
    });
});
