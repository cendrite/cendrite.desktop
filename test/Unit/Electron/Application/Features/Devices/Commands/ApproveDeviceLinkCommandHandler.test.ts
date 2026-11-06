import { describe, expect, test, vi } from 'vitest';
import nacl from 'tweetnacl';
import { ApproveDeviceLinkCommandHandler } from '#electron/Application/Features/Devices/Commands/ApproveDeviceLinkCommandHandler';
import { fingerprintOf } from '#electron/Infrastructure/Crypto/Fingerprint';
import { ApproveDeviceLinkCommand } from '#shared/Devices/ApproveDeviceLink';
import { Result } from '#shared/Result/Result';

const newDeviceKey = Buffer.from(nacl.sign.keyPair().publicKey).toString('base64');

function setup() {
    const provider = {
        getPendingLink: vi.fn(async () =>
            Result.success({ pendingLinkId: 'p1', devicePublicKey: newDeviceKey, devicePlatform: 'Linux', accountPublicKey: 'acc', expiresAt: '' }),
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

    test('the matching code signs the account key and the new device key, then approves', async () => {
        const { sut, provider, signer } = setup();

        const result = await sut.handle(new ApproveDeviceLinkCommand('p1', fingerprintOf(newDeviceKey)));

        expect(result.success).toBe(true);
        expect(signer.signDeviceApproval).toHaveBeenCalledWith('acc', newDeviceKey);
        expect(provider.approveLink).toHaveBeenCalledWith('p1', 'signature');
    });
});
