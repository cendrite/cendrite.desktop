import { describe, expect, test, vi } from 'vitest';
import { PurgeLocalDataService } from '../../../../../src/Electron/Infrastructure/Services/PurgeLocalDataService.js';
import { Group } from '../../../../../src/Electron/Domain/Entities/Group.js';
import { GroupLifecycle } from '../../../../../src/Electron/Domain/Enums/GroupLifecycle.js';
import { LedgerOperationType } from '../../../../../src/Electron/Domain/Enums/LedgerOperationType.js';
import { DeviceLeftOperation } from '../../../../../src/Electron/Domain/Protocol/LedgerOperation.js';
import { ErrorMessage } from '../../../../../src/Shared/Result/ErrorMessage.js';
import { Result } from '../../../../../src/Shared/Result/Result.js';

const cleared = () => ({ delete: vi.fn(), deleteAll: vi.fn(), clear: vi.fn() });
const GROUP_A = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e10';
const GROUP_B = '0199673a-3c1e-7c2b-9f2e-5d8b1a4c7e11';

interface Setup {
    groups?: Record<string, GroupLifecycle>;
    isInvite?: boolean;
    append?: () => Promise<Result<void>>;
    device?: { connectionId: string } | null;
}

function setup({ groups = {}, isInvite = false, append = async () => Result.success(), device = { connectionId: 'alice-laptop' } }: Setup = {}) {
    const order: string[] = [];
    const eventRepository = cleared();
    const mediaStore = cleared();
    const groupKeyRepository = {
        ...cleared(),
        deleteAll: vi.fn(async () => void order.push('wipe')),
        getWriteKey: vi.fn(async () => ({ publicKey: Buffer.from('alice-key'), isInvite })),
    };
    const groupRepository = {
        ...cleared(),
        getIds: vi.fn(async () => Object.keys(groups)),
        get: vi.fn(async (groupId: string) => new Group(groupId, groups[groupId])),
    };
    const ledgerWriter = {
        appendDeviceLeft: vi.fn(async (_groupId: string, _operation: DeviceLeftOperation) => {
            order.push('leave');
            return append();
        }),
    };

    const sut = new PurgeLocalDataService(
        { ...cleared(), get: vi.fn(async () => ({ userTag: 'alice' })) } as never,
        { ...cleared(), get: vi.fn(async () => device) } as never,
        cleared() as never,
        cleared() as never,
        cleared() as never,
        { accountScoped: () => [] } as never,
        groupKeyRepository as never,
        groupRepository as never,
        cleared() as never,
        cleared() as never,
        eventRepository as never,
        mediaStore as never,
        ledgerWriter as never,
    );

    return { sut, order, eventRepository, mediaStore, groupKeyRepository, ledgerWriter };
}

describe('purging local data', () => {
    test('clears the outbox and stored media along with the account data', async () => {
        const { sut, eventRepository, mediaStore } = setup();

        await sut.purgeLocalData();

        expect(eventRepository.deleteAll).toHaveBeenCalledOnce();
        expect(mediaStore.clear).toHaveBeenCalledOnce();
    });

    test('removes this device from every active group before wiping its keys', async () => {
        const { sut, order, ledgerWriter } = setup({ groups: { [GROUP_A]: GroupLifecycle.Active, [GROUP_B]: GroupLifecycle.Active } });

        await sut.purgeLocalData();

        expect(order).toEqual(['leave', 'leave', 'wipe']);
        const [groupId, operation] = ledgerWriter.appendDeviceLeft.mock.calls[0];
        expect(groupId).toBe(GROUP_A);
        expect(operation.type).toBe(LedgerOperationType.DeviceLeft);
        expect(operation.authorTag).toBe('alice');
        expect(operation.connectionId).toBe('alice-laptop');
        expect(operation.writeKeyPublic).toBe(Buffer.from('alice-key').toString('base64'));
    });

    test.each([GroupLifecycle.Draft, GroupLifecycle.Left])('skips a group in lifecycle %s', async (lifecycle) => {
        const { sut, ledgerWriter } = setup({ groups: { [GROUP_A]: lifecycle } });

        await sut.purgeLocalData();

        expect(ledgerWriter.appendDeviceLeft).not.toHaveBeenCalled();
    });

    test('skips a device that only holds an invite key', async () => {
        const { sut, ledgerWriter } = setup({ groups: { [GROUP_A]: GroupLifecycle.Active }, isInvite: true });

        await sut.purgeLocalData();

        expect(ledgerWriter.appendDeviceLeft).not.toHaveBeenCalled();
    });

    test('still wipes when the ledger refuses or fails', async () => {
        const { sut, groupKeyRepository } = setup({
            groups: { [GROUP_A]: GroupLifecycle.Active },
            append: async () => Result.fail(new ErrorMessage('ApiError', 'offline')),
        });

        await sut.purgeLocalData();

        expect(groupKeyRepository.deleteAll).toHaveBeenCalledOnce();
    });

    test('still wipes when leaving throws', async () => {
        const { sut, groupKeyRepository } = setup({
            groups: { [GROUP_A]: GroupLifecycle.Active },
            append: async () => {
                throw new Error('boom');
            },
        });

        await sut.purgeLocalData();

        expect(groupKeyRepository.deleteAll).toHaveBeenCalledOnce();
    });

    test('does not wait on a hung ledger forever', async () => {
        vi.useFakeTimers();
        try {
            const { sut, groupKeyRepository } = setup({
                groups: { [GROUP_A]: GroupLifecycle.Active },
                append: () => new Promise(() => undefined),
            });

            const purge = sut.purgeLocalData();
            await vi.advanceTimersByTimeAsync(5_000);
            await purge;

            expect(groupKeyRepository.deleteAll).toHaveBeenCalledOnce();
        } finally {
            vi.useRealTimers();
        }
    });

    test('wipes without a device row', async () => {
        const { sut, ledgerWriter, groupKeyRepository } = setup({ groups: { [GROUP_A]: GroupLifecycle.Active }, device: null });

        await sut.purgeLocalData();

        expect(ledgerWriter.appendDeviceLeft).not.toHaveBeenCalled();
        expect(groupKeyRepository.deleteAll).toHaveBeenCalledOnce();
    });
});
