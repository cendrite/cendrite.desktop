import { describe, expect, test, vi } from 'vitest';
import nacl from 'tweetnacl';
import { DeviceVerifier } from '#electron/Infrastructure/Services/DeviceVerifier';
import { deviceApprovalMessage } from '#electron/Infrastructure/Crypto/AccountKey';
import { DeviceChain } from '#electron/Application/Contracts/Providers/IDeviceProvider';
import { PinnedAccountKey } from '#electron/Domain/Encryption/PinnedAccountKey';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

function signedChain() {
    const account = nacl.sign.keyPair();
    const device = nacl.sign.keyPair();
    const signal = new Uint8Array([5, ...nacl.randomBytes(32)]);
    const chain: DeviceChain = {
        userTag: '482177301593',
        accountPublicKey: b64(account.publicKey),
        devices: [{
            id: 'device-1',
            connectionId: 'conn-1',
            publicKey: b64(device.publicKey),
            signalIdentityKey: b64(signal),
            approvedBy: 'account',
            approvalSignature: b64(nacl.sign.detached(deviceApprovalMessage(account.publicKey, device.publicKey, signal), account.secretKey)),
            removed: false,
        }],
        rotations: [],
    };
    return { chain, signal: b64(signal) };
}

function setup(chain: Result<DeviceChain>, pinned: PinnedAccountKey | null = null) {
    const provider = { getDeviceChain: vi.fn(async (_connectionId: string) => chain) };
    const store = {
        getPinnedAccountKey: vi.fn(async () => pinned),
        savePinnedAccountKey: vi.fn(async (_pin: PinnedAccountKey) => undefined),
    };
    return { store, provider, sut: new DeviceVerifier(provider as never, store as never) };
}

describe('device verifier', () => {
    test('pins the account key the first time a contact verifies', async () => {
        const { chain, signal } = signedChain();
        const { sut, store } = setup(Result.success(chain));

        expect(await sut.verify('conn-1', signal)).toEqual({ userTag: '482177301593', removed: false });
        expect(store.savePinnedAccountKey).toHaveBeenCalledWith(expect.objectContaining({ userTag: '482177301593', accountPublicKey: chain.accountPublicKey }));
    });

    test('does not pin anything when the chain fails', async () => {
        const { chain } = signedChain();
        const { sut, store } = setup(Result.success(chain));

        expect(await sut.verify('conn-1', b64(new Uint8Array([5, ...nacl.randomBytes(32)])))).toBeNull();
        expect(store.savePinnedAccountKey).not.toHaveBeenCalled();
    });

    test('refuses a contact whose account key changed without a rotation', async () => {
        const { chain, signal } = signedChain();
        const { sut } = setup(Result.success(chain), new PinnedAccountKey('482177301593', b64(nacl.sign.keyPair().publicKey), 0));

        expect(await sut.verify('conn-1', signal)).toBeNull();
    });

    test('a failed lookup throws instead of marking the device untrusted', async () => {
        const { sut } = setup(Result.fail<DeviceChain>(new ErrorMessage(null, 'offline')));

        await expect(sut.verify('conn-1', 'signal')).rejects.toThrow('offline');
    });

    test('a chain without a user tag throws instead of pinning or marking the device untrusted', async () => {
        const { chain, signal } = signedChain();
        const { sut, store } = setup(Result.success({ ...chain, userTag: undefined as unknown as string }));

        await expect(sut.verify('conn-1', signal)).rejects.toThrow('has no user tag');
        expect(store.savePinnedAccountKey).not.toHaveBeenCalled();
    });

    test('reports a device that has since been removed, so the caller can decide', async () => {
        const { chain, signal } = signedChain();
        chain.devices[0].removed = true;
        const { sut } = setup(Result.success(chain));

        expect(await sut.verify('conn-1', signal)).toEqual({ userTag: '482177301593', removed: true });
    });
});
