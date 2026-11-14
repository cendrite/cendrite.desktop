import { describe, expect, test, vi } from 'vitest';
import { WriteKeySwapPump } from '#electron/Infrastructure/Pumps/WriteKeySwapPump';
import { Group } from '#electron/Domain/Entities/Group';
import { GroupLifecycle } from '#electron/Domain/Enums/GroupLifecycle';
import { GroupState } from '#electron/Domain/Projections/GroupState';
import { GroupMember } from '#electron/Domain/Projections/GroupMember';
import { GroupWriteKey } from '#electron/Domain/Encryption/GroupWriteKey';
import { PendingGroupWriteKey } from '#electron/Domain/Encryption/PendingGroupWriteKey';
import { WriteKeyRegisteredOperation } from '#electron/Domain/Protocol/LedgerOperation';
import { ReplayResult } from '#electron/Application/Contracts/Services/ILedgerReplayService';
import { generateWriteKeyPair, WriteKeyPair } from '#electron/Infrastructure/Crypto/LedgerCodec';
import { ChatPrivileges } from '#shared/Enums/ChatPrivileges';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';

const GROUP_ID = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const TAG = '222222222222';
const b64 = (key: Buffer) => key.toString('base64');

function replayed(member: { writeKeys?: string[]; inviteKeys?: string[] } | null, stalledAt: number | null = null): Result<ReplayResult> {
    const state = new GroupState(GROUP_ID);
    if (member) {
        state.members.set(TAG, new GroupMember(TAG, 'Bob', ChatPrivileges.Member, 1, member.writeKeys ?? [], member.inviteKeys ?? []));
    }
    return Result.success({ state, rejected: [], verified: [], halted: null, stalledAt });
}

const unreadable = () => Result.fail<ReplayResult>(new ErrorMessage('Forbidden', 'Write key is not authorized for this ledger.'));

interface Setup {
    syncs: (invite: WriteKeyPair) => Result<ReplayResult>[];
    append?: Result<void>;
    pending?: WriteKeyPair;
    lifecycle?: GroupLifecycle;
}

function setup({ syncs, append = Result.success(), pending, lifecycle = GroupLifecycle.Active }: Setup) {
    const invite = generateWriteKeyPair();
    const keys = {
        current: new GroupWriteKey(GROUP_ID, invite.publicKey, invite.privateKey),
        pending: pending ? new PendingGroupWriteKey(GROUP_ID, pending.publicKey, pending.privateKey) : null,
    };

    const groupKeyRepository = {
        getWriteKey: vi.fn(async () => keys.current),
        saveWriteKey: vi.fn(async (key: GroupWriteKey) => void (keys.current = key)),
        getPendingWriteKey: vi.fn(async () => keys.pending),
        savePendingWriteKey: vi.fn(async (key: PendingGroupWriteKey) => void (keys.pending = key)),
        deletePendingWriteKey: vi.fn(async () => void (keys.pending = null)),
    };

    const results = syncs(invite);
    let syncCount = 0;
    const ledgerSyncService = { sync: vi.fn(async () => results[Math.min(syncCount++, results.length - 1)]) };
    const ledgerWriter = { append: vi.fn(async (_groupId: string, _operation: WriteKeyRegisteredOperation) => append) };

    const sut = new WriteKeySwapPump(
        { getIds: async () => [GROUP_ID], get: async () => new Group(GROUP_ID, lifecycle) } as never,
        groupKeyRepository as never,
        { get: async () => ({ userTag: TAG }) } as never,
        ledgerSyncService as never,
        ledgerWriter as never,
    );

    return { sut, keys, invite, ledgerWriter, groupKeyRepository };
}

const holdingInvite = (invite: WriteKeyPair) => [replayed({ inviteKeys: [b64(invite.publicKey)] })];

describe('swapping invite keys', () => {
    test('swaps the invite key for a new write key and keeps the new key', async () => {
        const { sut, keys, invite, ledgerWriter } = setup({ syncs: holdingInvite });

        await sut.reconcile(GROUP_ID);

        const [, operation] = ledgerWriter.append.mock.calls[0];
        expect(operation.authorTag).toBe(TAG);
        expect(operation.inviteKeyPublic).toBe(b64(invite.publicKey));
        expect(b64(keys.current.publicKey)).toBe(operation.writeKeyPublic);
        expect(keys.pending).toBeNull();
    });

    test('saves the new key as pending before asking the ledger', async () => {
        const { sut, ledgerWriter, groupKeyRepository } = setup({ syncs: holdingInvite });
        ledgerWriter.append.mockImplementationOnce(async () => {
            expect(groupKeyRepository.savePendingWriteKey).toHaveBeenCalledOnce();
            return Result.success();
        });

        await sut.reconcile(GROUP_ID);

        expect(ledgerWriter.append).toHaveBeenCalledOnce();
    });

    test('keeps the invite key when the append fails, and retries with the same pending key', async () => {
        const { sut, keys, invite, ledgerWriter } = setup({ syncs: holdingInvite, append: Result.fail(new ErrorMessage('Conflict', 'busy')) });

        await sut.reconcile(GROUP_ID);
        const pending = keys.pending!;
        await sut.reconcile(GROUP_ID);

        expect(keys.current.publicKey).toEqual(invite.publicKey);
        expect(ledgerWriter.append.mock.calls[1][1].writeKeyPublic).toBe(b64(pending.publicKey));
    });

    test('promotes the pending key when the swap went through but the new key was never stored', async () => {
        const next = generateWriteKeyPair();
        const { sut, keys, ledgerWriter } = setup({
            pending: next,
            syncs: () => [unreadable(), replayed({ writeKeys: [b64(next.publicKey)] })],
        });

        await sut.reconcile(GROUP_ID);

        expect(keys.current.publicKey).toEqual(next.publicKey);
        expect(keys.pending).toBeNull();
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test('goes back to the invite key when the pending key cannot read the ledger either', async () => {
        const { sut, keys, invite } = setup({ pending: generateWriteKeyPair(), syncs: () => [unreadable(), unreadable()] });

        await sut.reconcile(GROUP_ID);

        expect(keys.current.publicKey).toEqual(invite.publicKey);
    });

    test('does nothing once this device holds a write key', async () => {
        const { sut, ledgerWriter } = setup({ syncs: (invite) => [replayed({ writeKeys: [b64(invite.publicKey)] })] });

        await sut.reconcile(GROUP_ID);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test('does not swap when its key is no longer in the group', async () => {
        const { sut, ledgerWriter } = setup({ syncs: () => [replayed({ writeKeys: ['someone-else'] })] });

        await sut.reconcile(GROUP_ID);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test('waits while replay is stalled', async () => {
        const { sut, ledgerWriter } = setup({ syncs: (invite) => [replayed({ inviteKeys: [b64(invite.publicKey)] }, 2)] });

        await sut.reconcile(GROUP_ID);

        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test('leaves groups that have not started alone', async () => {
        const { sut, ledgerWriter, groupKeyRepository } = setup({ syncs: holdingInvite, lifecycle: GroupLifecycle.Draft });

        await sut.reconcile(GROUP_ID);

        expect(groupKeyRepository.getWriteKey).not.toHaveBeenCalled();
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });
});
