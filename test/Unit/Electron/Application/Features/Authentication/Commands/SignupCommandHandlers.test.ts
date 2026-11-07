import { describe, expect, test, vi } from 'vitest';
import nacl from 'tweetnacl';

vi.mock('electron', () => ({ app: { getVersion: () => '1.4.2' } }));

import { BeginSignupCommandHandler } from '#electron/Application/Features/Authentication/Commands/BeginSignupCommandHandler';
import { CompleteSignupCommandHandler } from '#electron/Application/Features/Authentication/Commands/CompleteSignupCommandHandler';
import { CancelSignupCommandHandler } from '#electron/Application/Features/Authentication/Commands/CancelSignupCommandHandler';
import { EphemeralStore } from '#electron/Infrastructure/Services/EphemeralStore';
import { NonceSigner } from '#electron/Infrastructure/Services/NonceSigner';
import { deriveAccountKey } from '#electron/Infrastructure/Crypto/AccountKey';
import { isProofOfWorkSolved } from '#electron/Infrastructure/Crypto/ProofOfWork';
import { BeginSignupCommand } from '#shared/Authentication/BeginSignup';
import { CancelSignupCommand } from '#shared/Authentication/CancelSignup';
import { CompleteSignupCommand } from '#shared/Authentication/CompleteSignup';
import { SignupRequest } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { UserContract } from '#shared/Models/UserContract';

const challenge = Buffer.from(Uint8Array.from({ length: 32 }, (_, i) => i)).toString('base64');

function setup() {
    const store = new EphemeralStore();
    const provider = {
        getSignupChallenge: vi.fn(async () => Result.success({ challengeId: 'challenge-1', challenge, difficulty: 8, expiresAt: '' })),
        signup: vi.fn(async (_req: SignupRequest) => Result.success({ userId: 'user-1', deviceId: 'device-1', deviceConnectionId: 'conn-1' })),
    };
    const session = {
        start: vi.fn(async () => Result.success(new UserContract('user-1', 'alice', 'alice#1', 'device-1', 'conn-1', []))),
    };

    const begin = new BeginSignupCommandHandler(store);
    const complete = new CompleteSignupCommandHandler(store, provider as never, new NonceSigner(null as never), session as never);

    return { store, provider, session, begin, complete };
}

async function beginAndAnswer(begin: BeginSignupCommandHandler) {
    const started = await begin.handle(new BeginSignupCommand());
    if (!started.success) throw new Error('begin failed');
    const { words, confirmIndices } = started.data;
    return { words, answers: confirmIndices.map((i) => words[i]) };
}

describe('signup', () => {
    test('begin returns 12 words and 3 distinct positions to confirm', async () => {
        const { begin, store } = setup();

        const result = await begin.handle(new BeginSignupCommand());

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.words).toHaveLength(12);
        expect(new Set(result.data.confirmIndices).size).toBe(3);
        expect(result.data.confirmIndices).toEqual([...result.data.confirmIndices].sort((a, b) => a - b));
        expect(store.get('signup')?.words).toEqual(result.data.words);
    });

    test('complete fails without a started signup', async () => {
        const { complete, provider } = setup();

        const result = await complete.handle(new CompleteSignupCommand('alice', ['a', 'b', 'c']));

        expect(result.success).toBe(false);
        expect(provider.getSignupChallenge).not.toHaveBeenCalled();
    });

    test('complete rejects wrong confirmation words without calling the server', async () => {
        const { begin, complete, provider } = setup();
        await begin.handle(new BeginSignupCommand());

        const result = await complete.handle(new CompleteSignupCommand('alice', ['wrong', 'words', 'here']));

        expect(result.success).toBe(false);
        expect(provider.getSignupChallenge).not.toHaveBeenCalled();
    });

    test('complete solves the challenge, signs with the phrase key and starts the session', async () => {
        const { begin, complete, provider, session, store } = setup();
        const { words, answers } = await beginAndAnswer(begin);

        const result = await complete.handle(new CompleteSignupCommand('alice', answers.map((w) => ` ${w.toUpperCase()} `)));

        expect(result.success).toBe(true);
        const request = provider.signup.mock.calls[0][0];
        const accountKey = deriveAccountKey(words);
        const challengeBytes = Buffer.from(challenge, 'base64');

        expect(request.accountPublicKey).toBe(Buffer.from(accountKey.publicKey).toString('base64'));
        expect(isProofOfWorkSolved(challengeBytes, BigInt(request.powNonce), 8)).toBe(true);
        expect(nacl.sign.detached.verify(
            Buffer.concat([Buffer.from('cendrite-signup-v1'), challengeBytes]),
            Buffer.from(request.challengeSignature, 'base64'),
            accountKey.publicKey,
        )).toBe(true);
        expect(nacl.sign.detached.verify(
            Buffer.concat([Buffer.from('device-approval-v1'), accountKey.publicKey, Buffer.from(request.devicePublicKey, 'base64')]),
            Buffer.from(request.deviceApproval, 'base64'),
            accountKey.publicKey,
        )).toBe(true);
        expect(request).toMatchObject({ username: 'alice', challengeId: 'challenge-1', deviceAppVersion: '1.4', deviceType: 2 });

        const startedDevice = (session.start.mock.calls[0] as unknown[])[1] as { id: string; publicKey: string };
        expect(startedDevice.id).toBe('device-1');
        expect(startedDevice.publicKey).toBe(request.devicePublicKey);
        expect(store.get('signup')).toBeNull();
    });

    test('a failed device setup keeps the account so a retry does not sign up again', async () => {
        const { begin, complete, provider, session } = setup();
        const { answers } = await beginAndAnswer(begin);
        session.start.mockResolvedValueOnce(Result.fail(new ErrorMessage('Unauthorized', 'setup failed')) as never);

        const first = await complete.handle(new CompleteSignupCommand('alice', answers));
        const retry = await complete.handle(new CompleteSignupCommand('alice', answers));

        expect(first.success).toBe(false);
        expect(retry.success).toBe(true);
        expect(provider.signup).toHaveBeenCalledOnce();
        expect(session.start).toHaveBeenCalledTimes(2);
    });

    test('a server rejection is passed through and the phrase is kept for another try', async () => {
        const { begin, complete, provider, store } = setup();
        const { answers } = await beginAndAnswer(begin);
        provider.signup.mockResolvedValueOnce(Result.fail(new ErrorMessage('Bad Request', 'Username is taken')) as never);

        const result = await complete.handle(new CompleteSignupCommand('alice', answers));

        expect(result.success).toBe(false);
        if (!result.success) expect(result.errorMessage.message).toBe('Username is taken');
        expect(store.get('signup')?.registration).toBeNull();
    });

    test('refuses an unreasonable difficulty from the server', async () => {
        const { begin, complete, provider } = setup();
        const { answers } = await beginAndAnswer(begin);
        provider.getSignupChallenge.mockResolvedValueOnce(Result.success({ challengeId: 'c', challenge, difficulty: 200, expiresAt: '' }));

        const result = await complete.handle(new CompleteSignupCommand('alice', answers));

        expect(result.success).toBe(false);
        expect(provider.signup).not.toHaveBeenCalled();
    });

    test('cancel forgets the phrase', async () => {
        const { begin, store } = setup();
        await begin.handle(new BeginSignupCommand());

        await new CancelSignupCommandHandler(store).handle(new CancelSignupCommand());

        expect(store.get('signup')).toBeNull();
    });
});
