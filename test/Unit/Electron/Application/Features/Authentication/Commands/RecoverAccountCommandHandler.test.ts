import { describe, expect, test, vi } from 'vitest';
import nacl from 'tweetnacl';

vi.mock('electron', () => ({ app: { getVersion: () => '1.4.2' } }));

import { RecoverAccountCommandHandler } from '#electron/Application/Features/Authentication/Commands/RecoverAccountCommandHandler';
import { NonceSigner } from '#electron/Infrastructure/Services/NonceSigner';
import { deriveAccountKey } from '#electron/Infrastructure/Crypto/AccountKey';
import { RecoverAccountCommand } from '#shared/Authentication/Recover';
import { RecoverRequest } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { UserContract } from '#shared/Models/UserContract';

const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' ');
const challenge = Buffer.from(Uint8Array.from({ length: 32 }, (_, i) => i)).toString('base64');

function setup() {
    const provider = {
        getRecoveryChallenge: vi.fn(async (_key: string) => Result.success({ challengeId: 'challenge-1', challenge, expiresAt: '' })),
        recover: vi.fn(async (_req: RecoverRequest) => Result.success({ userId: 'user-1', deviceId: 'device-2', deviceConnectionId: 'conn-2' })),
    };
    const session = {
        start: vi.fn(async () => Result.success(new UserContract('user-1', 'alice', 'alice#1', 'device-2', 'conn-2', []))),
    };
    const keyGenerator = { generateIdentity: vi.fn(() => ({ publicKey: Buffer.from([5, ...new Array(32).fill(7)]).toString('base64'), privateKey: 'signal-private' })) };
    const sut = new RecoverAccountCommandHandler(provider as never, new NonceSigner(null as never), session as never, keyGenerator as never);
    return { sut, provider, session };
}

describe('recover account', () => {
    test('rejects a phrase with a bad checksum without calling the server', async () => {
        const { sut, provider } = setup();

        const result = await sut.handle(new RecoverAccountCommand([...phrase.slice(0, 11), 'abandon']));

        expect(result.success).toBe(false);
        expect(provider.getRecoveryChallenge).not.toHaveBeenCalled();
    });

    test('rejects a phrase with the wrong number of words', async () => {
        const { sut, provider } = setup();

        const result = await sut.handle(new RecoverAccountCommand(phrase.slice(0, 11)));

        expect(result.success).toBe(false);
        expect(provider.getRecoveryChallenge).not.toHaveBeenCalled();
    });

    test('signs the challenge and approves the new device with the phrase key, then starts the session', async () => {
        const { sut, provider, session } = setup();

        const result = await sut.handle(new RecoverAccountCommand(phrase.map((w) => ` ${w.toUpperCase()} `)));

        expect(result.success).toBe(true);
        const key = deriveAccountKey(phrase);
        const accountPublicKey = Buffer.from(key.publicKey).toString('base64');
        expect(provider.getRecoveryChallenge).toHaveBeenCalledWith(accountPublicKey);

        const request = provider.recover.mock.calls[0][0];
        expect(request.accountPublicKey).toBe(accountPublicKey);
        expect(nacl.sign.detached.verify(
            Buffer.concat([Buffer.from('cendrite-recovery-v1'), Buffer.from(challenge, 'base64')]),
            Buffer.from(request.challengeSignature, 'base64'),
            key.publicKey,
        )).toBe(true);
        expect(nacl.sign.detached.verify(
            Buffer.concat([
                Buffer.from('device-approval-v1'),
                key.publicKey,
                Buffer.from(request.devicePublicKey, 'base64'),
                Buffer.from(request.signalIdentityKey, 'base64'),
            ]),
            Buffer.from(request.deviceApproval, 'base64'),
            key.publicKey,
        )).toBe(true);
        expect(request).toMatchObject({ challengeId: 'challenge-1', deviceAppVersion: '1.4', deviceType: 2 });

        const startedDevice = (session.start.mock.calls[0] as unknown[])[1] as { id: string; publicKey: string };
        expect(startedDevice.id).toBe('device-2');
        expect(startedDevice.publicKey).toBe(request.devicePublicKey);
        expect((session.start.mock.calls[0] as unknown[])[2]).toEqual({ publicKey: request.signalIdentityKey, privateKey: 'signal-private' });
    });

    test('turns a server rejection into a friendly message without starting a session', async () => {
        const { sut, provider, session } = setup();
        provider.recover.mockResolvedValueOnce(Result.fail(new ErrorMessage('Bad Request', 'Recovery failed')) as never);

        const result = await sut.handle(new RecoverAccountCommand(phrase));

        expect(result.success).toBe(false);
        if (!result.success) expect(result.errorMessage.code).toBe('RecoveryFailed');
        expect(session.start).not.toHaveBeenCalled();
    });

    test('reports rate limiting on the challenge separately', async () => {
        const { sut, provider } = setup();
        provider.getRecoveryChallenge.mockResolvedValueOnce(Result.fail(new ErrorMessage('Too Many Requests', 'slow down')) as never);

        const result = await sut.handle(new RecoverAccountCommand(phrase));

        expect(result.success).toBe(false);
        if (!result.success) expect(result.errorMessage.code).toBe('TooManyRequests');
        expect(provider.recover).not.toHaveBeenCalled();
    });
});
