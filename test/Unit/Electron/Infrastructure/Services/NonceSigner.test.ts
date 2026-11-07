import { describe, expect, test } from 'vitest';
import nacl from 'tweetnacl';
import { NonceSigner } from '#electron/Infrastructure/Services/NonceSigner';

function signerWithDevice() {
    const keys = nacl.sign.keyPair();
    const repository = {
        get: async () => ({ privateKey: Buffer.from(keys.secretKey).toString('base64') }),
    };
    return { sut: new NonceSigner(repository as never), publicKey: keys.publicKey };
}

describe('nonce signer', () => {
    const nonce = Buffer.from(nacl.randomBytes(32));

    test('signs the nonce behind the cendrite-auth-v1 label', async () => {
        const { sut, publicKey } = signerWithDevice();

        const signature = Buffer.from(await sut.signNonce(nonce.toString('base64')), 'base64');

        const labelled = Buffer.concat([Buffer.from('cendrite-auth-v1', 'ascii'), nonce]);
        expect(nacl.sign.detached.verify(labelled, signature, publicKey)).toBe(true);
    });

    test('a signature over the raw nonce is not produced', async () => {
        const { sut, publicKey } = signerWithDevice();

        const signature = Buffer.from(await sut.signNonce(nonce.toString('base64')), 'base64');

        expect(nacl.sign.detached.verify(nonce, signature, publicKey)).toBe(false);
    });

    test('a nonce that mimics a device approval cannot yield a valid approval', async () => {
        const { sut, publicKey } = signerWithDevice();
        const approval = Buffer.concat([Buffer.from('device-approval-v1', 'ascii'), nacl.randomBytes(64)]);

        const signature = Buffer.from(await sut.signNonce(approval.toString('base64')), 'base64');

        expect(nacl.sign.detached.verify(approval, signature, publicKey)).toBe(false);
    });

    test('approves an account rotation with the device key over old then new', async () => {
        const { sut, publicKey } = signerWithDevice();
        const oldKey = nacl.randomBytes(32);
        const newKey = nacl.randomBytes(32);

        const signature = Buffer.from(
            await sut.signAccountRotation(Buffer.from(oldKey).toString('base64'), Buffer.from(newKey).toString('base64')),
            'base64',
        );

        const message = Buffer.concat([Buffer.from('account-rotate-v1', 'ascii'), oldKey, newKey]);
        expect(nacl.sign.detached.verify(message, signature, publicKey)).toBe(true);
    });
});
