import { describe, expect, test, vi } from 'vitest';
import nacl from 'tweetnacl';
import { ApproveDeviceLinkCommandHandler } from '#electron/Application/Features/Devices/Commands/ApproveDeviceLinkCommandHandler';
import { fingerprintOf } from '#electron/Infrastructure/Crypto/Fingerprint';
import { ApproveDeviceLinkCommand } from '#shared/Devices/ApproveDeviceLink';
import { Result } from '#shared/Result/Result';

const newDeviceKey = Buffer.from(nacl.sign.keyPair().publicKey).toString('base64');
const newSignalKey = Buffer.from([5, ...nacl.randomBytes(32)]).toString('base64');

function setup() {
    const provider = {
        getPendingLink: vi.fn(async () =>
            Result.success({ pendingLinkId: 'p1', devicePublicKey: newDeviceKey, signalIdentityKey: newSignalKey, devicePlatform: 'Linux', accountPublicKey: 'acc', expiresAt: '' }),
        ),
        approveLink: vi.fn(async () => Result.success()),
        rejectLink: vi.fn(async () => Result.success()),
    };
    const signer = { signDeviceApproval: vi.fn(async () => 'signature') };
    return { provider, signer, sut: new ApproveDeviceLinkCommandHandler(provider as never, signer as never) };
}

describe('approving a device link', () => {
    test('a picked code that does not match the new device is never signed and cancels the request', async () => {
        const { sut, provider, signer } = setup();

        const result = await sut.handle(new ApproveDeviceLinkCommand('p1', '00000 00000 00000 00000'));

        expect(result.success).toBe(false);
        expect(signer.signDeviceApproval).not.toHaveBeenCalled();
        expect(provider.approveLink).not.toHaveBeenCalled();
        expect(provider.rejectLink).toHaveBeenCalledWith('p1');
    });

    test('a code computed from the device key alone does not match, so a swapped Signal key is caught', async () => {
        const { sut, signer } = setup();

        const result = await sut.handle(new ApproveDeviceLinkCommand('p1', fingerprintOf(newDeviceKey, Buffer.from([5, ...nacl.randomBytes(32)]).toString('base64'))));

        expect(result.success).toBe(false);
        expect(signer.signDeviceApproval).not.toHaveBeenCalled();
    });

    test('the matching code signs the account key, the new device key and its Signal key, then approves', async () => {
        const { sut, provider, signer } = setup();

        const result = await sut.handle(new ApproveDeviceLinkCommand('p1', fingerprintOf(newDeviceKey, newSignalKey)));

        expect(result.success).toBe(true);
        expect(signer.signDeviceApproval).toHaveBeenCalledWith('acc', newDeviceKey, newSignalKey);
        expect(provider.approveLink).toHaveBeenCalledWith('p1', 'signature');
    });
});
