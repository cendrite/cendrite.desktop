import { describe, expect, test, vi } from 'vitest';
import { DeviceSessionService } from '#electron/Application/Services/Device/DeviceSessionService';
import { Device } from '#electron/Domain/Entities/Device';
import { Result } from '#shared/Result/Result';

const profile = {
    id: 'user-1',
    username: 'alice',
    userTag: 'alice#1',
    avatarKey: null,
    displayName: null,
    connectionIds: ['conn-1', 'conn-2'],
};

function setup(overrides: { tokenInit?: () => Promise<void> } = {}) {
    const calls: string[] = [];
    const track = (name: string, value?: unknown) => vi.fn(async () => { calls.push(name); return value; });

    const deps = {
        deviceRepository: { delete: track('device.delete'), create: track('device.create') },
        userRepository: {
            delete: track('user.delete'),
            create: vi.fn(async (user: unknown) => { calls.push('user.create'); return user; }),
        },
        userProvider: { getUserProfile: track('profile', Result.success(profile)) },
        tokenManager: { init: vi.fn(overrides.tokenInit ?? (async () => { calls.push('token.init'); })), disableAndClear: vi.fn() },
        keyGenerator: { generateKeyBundle: track('keys') },
        signalManager: { connect: track('signal.connect'), disconnect: track('signal.disconnect') },
        messagePump: { start: vi.fn() },
        deliveryStatusUpdatePump: { start: vi.fn() },
        preKeyPump: { start: vi.fn() },
        writeKeySwapPump: { start: vi.fn() },
        purgeLocalDataService: { purgeLocalData: track('purge') },
    };

    const sut = new DeviceSessionService(
        deps.deviceRepository as never,
        deps.userRepository as never,
        deps.userProvider as never,
        deps.tokenManager as never,
        deps.keyGenerator as never,
        deps.signalManager as never,
        deps.messagePump as never,
        deps.deliveryStatusUpdatePump as never,
        deps.preKeyPump as never,
        deps.writeKeySwapPump as never,
        deps.purgeLocalDataService as never,
    );

    return { sut, deps, calls };
}

const device = () => new Device('device-1', 'conn-1', 'private', 'public');
const identity = { publicKey: 'signal-public', privateKey: 'signal-private' };

describe('device session', () => {
    test('clears stale local state before saving the new device, then signs in', async () => {
        const { sut, deps, calls } = setup();

        const result = await sut.start('user-1', device(), identity);

        expect(result.success).toBe(true);
        expect(calls.slice(0, 3)).toEqual(['user.delete', 'device.delete', 'device.create']);
        expect(calls).toContain('token.init');
        expect(deps.tokenManager.init).toHaveBeenCalledWith('user-1', 'device-1');
        expect(deps.messagePump.start).toHaveBeenCalledOnce();
        expect(deps.purgeLocalDataService.purgeLocalData).not.toHaveBeenCalled();
        if (result.success) {
            expect(result.data.deviceId).toBe('device-1');
            expect(result.data.externalConnectionIds).toEqual(['conn-1', 'conn-2']);
        }
    });

    test('rolls back and leaves no device behind when a step after saving fails', async () => {
        const { sut, deps } = setup({ tokenInit: async () => { throw new Error('verify-nonce failed'); } });

        const result = await sut.start('user-1', device(), identity);

        expect(result.success).toBe(false);
        expect(deps.signalManager.disconnect).toHaveBeenCalledOnce();
        expect(deps.tokenManager.disableAndClear).toHaveBeenCalledOnce();
        expect(deps.purgeLocalDataService.purgeLocalData).toHaveBeenCalledOnce();
        expect(deps.messagePump.start).not.toHaveBeenCalled();
    });

    test('rolls back when the profile cannot be fetched', async () => {
        const { sut, deps } = setup();
        deps.userProvider.getUserProfile = vi.fn(async () => Result.success(undefined)) as never;

        const result = await sut.start('user-1', device(), identity);

        expect(result.success).toBe(false);
        expect(deps.purgeLocalDataService.purgeLocalData).toHaveBeenCalledOnce();
    });

    test('publishes the key bundle only after every remote step succeeded', async () => {
        const { sut, calls, deps } = setup();

        await sut.start('user-1', device(), identity);

        expect(calls.indexOf('keys')).toBeGreaterThan(calls.indexOf('signal.connect'));
        expect(calls.indexOf('keys')).toBeGreaterThan(calls.indexOf('profile'));
        expect(calls.indexOf('keys')).toBeGreaterThan(calls.indexOf('user.create'));
        expect(deps.keyGenerator.generateKeyBundle).toHaveBeenCalledWith('conn-1', identity);
    });

    test('a failed setup publishes no key bundle, so a retry is the first key for the device', async () => {
        const { sut, deps } = setup();
        deps.userProvider.getUserProfile = vi.fn(async () => Result.success(undefined)) as never;

        await sut.start('user-1', device(), identity);

        expect(deps.keyGenerator.generateKeyBundle).not.toHaveBeenCalled();
    });
});
