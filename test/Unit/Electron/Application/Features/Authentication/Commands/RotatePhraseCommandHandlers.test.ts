import { describe, expect, test, vi } from 'vitest';
import nacl from 'tweetnacl';
import { BeginRotatePhraseCommandHandler } from '#electron/Application/Features/Authentication/Commands/BeginRotatePhraseCommandHandler';
import { CompleteRotatePhraseCommandHandler } from '#electron/Application/Features/Authentication/Commands/CompleteRotatePhraseCommandHandler';
import { CancelRotatePhraseCommandHandler } from '#electron/Application/Features/Authentication/Commands/CancelRotatePhraseCommandHandler';
import { PendingRotationStore } from '#electron/Infrastructure/Services/PendingRotationStore';
import { NonceSigner } from '#electron/Infrastructure/Services/NonceSigner';
import { deriveAccountKey } from '#electron/Infrastructure/Crypto/AccountKey';
import { BeginRotatePhraseCommand } from '#shared/Authentication/BeginRotatePhrase';
import { CompleteRotatePhraseCommand } from '#shared/Authentication/CompleteRotatePhrase';
import { CancelRotatePhraseCommand } from '#shared/Authentication/CancelRotatePhrase';
import { RotateAccountKeyRequest } from '#electron/Application/Contracts/Providers/IAuthenticationProvider';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';

const oldAccountKey = Buffer.from(nacl.sign.keyPair().publicKey).toString('base64');

function setup() {
    const device = nacl.sign.keyPair();
    const store = new PendingRotationStore();
    const provider = {
        getAccountKey: vi.fn(async () => Result.success({ accountPublicKey: oldAccountKey })),
        rotateAccountKey: vi.fn(async (_req: RotateAccountKeyRequest) => Result.success()),
    };
    const signer = new NonceSigner({ get: async () => ({ privateKey: Buffer.from(device.secretKey).toString('base64') }) } as never);

    return {
        store,
        provider,
        devicePublicKey: device.publicKey,
        begin: new BeginRotatePhraseCommandHandler(store),
        complete: new CompleteRotatePhraseCommandHandler(store, provider as never, signer),
        cancel: new CancelRotatePhraseCommandHandler(store),
    };
}

async function beginAndAnswer(begin: BeginRotatePhraseCommandHandler) {
    const started = await begin.handle(new BeginRotatePhraseCommand());
    if (!started.success) throw new Error('begin failed');
    const { words, confirmIndices } = started.data;
    return { words, answers: confirmIndices.map((i) => words[i]) };
}

describe('rotate recovery phrase', () => {
    test('begin returns 12 new words and 3 distinct positions to confirm', async () => {
        const { begin, store } = setup();

        const result = await begin.handle(new BeginRotatePhraseCommand());

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.words).toHaveLength(12);
        expect(new Set(result.data.confirmIndices).size).toBe(3);
        expect(store.get()?.words).toEqual(result.data.words);
    });

    test('complete fails without a started rotation', async () => {
        const { complete, provider } = setup();

        const result = await complete.handle(new CompleteRotatePhraseCommand(['a', 'b', 'c']));

        expect(result.success).toBe(false);
        expect(provider.getAccountKey).not.toHaveBeenCalled();
    });

    test('complete rejects wrong confirmation words without calling the server', async () => {
        const { begin, complete, provider } = setup();
        await beginAndAnswer(begin);

        const result = await complete.handle(new CompleteRotatePhraseCommand(['wrong', 'words', 'here']));

        expect(result.success).toBe(false);
        expect(provider.getAccountKey).not.toHaveBeenCalled();
        expect(provider.rotateAccountKey).not.toHaveBeenCalled();
    });

    test('complete sends the new public key, signed by the new key and the device over old then new', async () => {
        const { begin, complete, provider, store, devicePublicKey } = setup();
        const { words, answers } = await beginAndAnswer(begin);

        const result = await complete.handle(new CompleteRotatePhraseCommand(answers.map((a) => ` ${a.toUpperCase()} `)));

        expect(result.success).toBe(true);
        const request = provider.rotateAccountKey.mock.calls[0][0];
        const newKey = deriveAccountKey(words).publicKey;
        const message = Buffer.concat([Buffer.from('account-rotate-v1', 'ascii'), Buffer.from(oldAccountKey, 'base64'), newKey]);

        expect(request.newAccountPublicKey).toBe(Buffer.from(newKey).toString('base64'));
        expect(nacl.sign.detached.verify(message, Buffer.from(request.proof, 'base64'), newKey)).toBe(true);
        expect(nacl.sign.detached.verify(message, Buffer.from(request.approval, 'base64'), devicePublicKey)).toBe(true);
        expect(store.get()).toBeNull();
    });

    test('a failed rotation keeps the words so the user can retry', async () => {
        const { begin, complete, provider, store } = setup();
        const { answers } = await beginAndAnswer(begin);
        provider.rotateAccountKey.mockResolvedValueOnce(Result.fail(new ErrorMessage('ApiError', 'Rotation failed')));

        const result = await complete.handle(new CompleteRotatePhraseCommand(answers));

        expect(result.success).toBe(false);
        expect(store.get()).not.toBeNull();
    });

    test('cancel wipes the pending words', async () => {
        const { begin, cancel, store } = setup();
        const { words } = await beginAndAnswer(begin);
        const held = store.get()!;

        await cancel.handle(new CancelRotatePhraseCommand());

        expect(store.get()).toBeNull();
        expect(held.words.every((w) => w === '')).toBe(true);
        expect(words.some((w) => w !== '')).toBe(true);
    });
});
