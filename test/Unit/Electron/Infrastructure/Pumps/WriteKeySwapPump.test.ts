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
import { MembershipWarning } from '#shared/Enums/MembershipWarning';
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
const offline = () => Result.fail<ReplayResult>(new ErrorMessage('ApiError', 'An unexpected error occurred.'));
const halted = () => Result.success<ReplayResult>({
    state: new GroupState(GROUP_ID),
    rejected: [],
    verified: [],
    halted: { version: 2, reason: 'outer signature does not verify' },
    stalledAt: null,
});

interface Setup {
    syncs: (invite: WriteKeyPair) => Result<ReplayResult>[];
    append?: Result<void>;
    pending?: WriteKeyPair;
    lifecycle?: GroupLifecycle;
    warning?: MembershipWarning | null;
}

function setup({ syncs, append = Result.success(), pending, lifecycle = GroupLifecycle.Active, warning = null }: Setup) {
    const invite = generateWriteKeyPair();
    const keys = {
        current: new GroupWriteKey(GROUP_ID, invite.publicKey, invite.privateKey, true),
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
    const send = vi.fn();
    const group = new Group(GROUP_ID, lifecycle);
    group.membershipWarning = warning;
    const groupRepository = {
        getIds: async () => [GROUP_ID],
        get: async () => group,
        setMembershipWarning: vi.fn(async () => undefined),
    };

    const sut = new WriteKeySwapPump(
        groupRepository as never,
        groupKeyRepository as never,
        { get: async () => ({ userTag: TAG }) } as never,
        ledgerSyncService as never,
        ledgerWriter as never,
        { isDestroyed: () => false, webContents: { send } } as never,
    );

    return { sut, keys, invite, ledgerWriter, groupKeyRepository, groupRepository, send };
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
        expect(keys.current.isInvite).toBe(false);
        expect(keys.pending).toBeNull();
    });

    test('tells the window the group can be edited once the swap is stored', async () => {
        const { sut, send } = setup({ syncs: holdingInvite });

        await sut.reconcile(GROUP_ID);

        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupEditable', groupId: GROUP_ID });
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
        const { sut, keys, invite, ledgerWriter, send } = setup({ syncs: holdingInvite, append: Result.fail(new ErrorMessage('Conflict', 'busy')) });

        await sut.reconcile(GROUP_ID);
        const pending = keys.pending!;
        await sut.reconcile(GROUP_ID);

        expect(keys.current.publicKey).toEqual(invite.publicKey);
        expect(keys.current.isInvite).toBe(true);
        expect(send).not.toHaveBeenCalled();
        expect(ledgerWriter.append.mock.calls[1][1].writeKeyPublic).toBe(b64(pending.publicKey));
    });

    test('promotes the pending key when the swap went through but the new key was never stored', async () => {
        const next = generateWriteKeyPair();
        const { sut, keys, ledgerWriter, send } = setup({
            pending: next,
            syncs: () => [unreadable(), replayed({ writeKeys: [b64(next.publicKey)] })],
        });

        await sut.reconcile(GROUP_ID);

        expect(keys.current.publicKey).toEqual(next.publicKey);
        expect(keys.current.isInvite).toBe(false);
        expect(send).toHaveBeenCalledWith('eventMessage', { kind: 'groupEditable', groupId: GROUP_ID });
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

describe('membership warnings', () => {
    const warned = (warning: MembershipWarning | null) => ['eventMessage', { kind: 'membershipWarning', groupId: GROUP_ID, warning }];

    test('warns of tampering when its own invite key was already used', async () => {
        const { sut, groupRepository, send } = setup({ syncs: holdingInvite, append: Result.fail(new ErrorMessage('Forbidden', 'used')) });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).toHaveBeenCalledWith(GROUP_ID, MembershipWarning.Tampered);
        expect(send).toHaveBeenCalledWith(...warned(MembershipWarning.Tampered));
    });

    test('warns of tampering when its key is no longer in the group', async () => {
        const { sut, groupRepository } = setup({ syncs: () => [replayed({ writeKeys: ['someone-else'] })] });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).toHaveBeenCalledWith(GROUP_ID, MembershipWarning.Tampered);
    });

    test('warns of tampering when replay halts on the log', async () => {
        const { sut, groupRepository, ledgerWriter } = setup({ syncs: () => [halted()] });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).toHaveBeenCalledWith(GROUP_ID, MembershipWarning.Tampered);
        expect(ledgerWriter.append).not.toHaveBeenCalled();
    });

    test('warns of lost access when the ledger refuses its key', async () => {
        const { sut, groupRepository } = setup({ syncs: () => [unreadable()] });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).toHaveBeenCalledWith(GROUP_ID, MembershipWarning.LostAccess);
    });

    test('does not warn when the ledger cannot be reached', async () => {
        const { sut, groupRepository, send } = setup({ syncs: () => [offline()] });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
    });

    test('clears the warning once its write key is in the group again', async () => {
        const { sut, groupRepository, send } = setup({
            warning: MembershipWarning.LostAccess,
            syncs: (invite) => [replayed({ writeKeys: [b64(invite.publicKey)] })],
        });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).toHaveBeenCalledWith(GROUP_ID, null);
        expect(send).toHaveBeenCalledWith(...warned(null));
    });

    test('keeps the tampered warning without announcing it again when the swap is refused again', async () => {
        const { sut, groupRepository, send } = setup({
            warning: MembershipWarning.Tampered,
            syncs: holdingInvite,
            append: Result.fail(new ErrorMessage('Forbidden', 'used')),
        });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
    });

    test('clears the tampered warning once the swap goes through', async () => {
        const { sut, groupRepository, send } = setup({ warning: MembershipWarning.Tampered, syncs: holdingInvite });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).toHaveBeenCalledWith(GROUP_ID, null);
        expect(send).toHaveBeenCalledWith(...warned(null));
    });

    test('clears lost access once its invite key can read again, even if the swap has to retry', async () => {
        const { sut, groupRepository } = setup({
            warning: MembershipWarning.LostAccess,
            syncs: holdingInvite,
            append: Result.fail(new ErrorMessage('Conflict', 'busy')),
        });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).toHaveBeenCalledWith(GROUP_ID, null);
    });

    test('does not store or announce a warning that has not changed', async () => {
        const { sut, groupRepository, send } = setup({
            warning: MembershipWarning.Tampered,
            syncs: () => [replayed({ writeKeys: ['someone-else'] })],
        });

        await sut.reconcile(GROUP_ID);

        expect(groupRepository.setMembershipWarning).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
    });
});
