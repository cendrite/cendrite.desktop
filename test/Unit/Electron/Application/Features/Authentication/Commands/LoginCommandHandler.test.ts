import { describe, expect, test, vi } from 'vitest';
import { LoginCommandHandler } from '../../../../../../../src/Electron/Application/Features/Authentication/Commands/LoginCommandHandler.js';
import { IAuthenticationProvider } from '../../../../../../../src/Electron/Application/Contracts/Providers/IAuthenticationProvider.js';
import { PendingLoginStore } from '../../../../../../../src/Electron/Infrastructure/Services/PendingLoginStore.js';
import { LoginCommand } from '../../../../../../../src/Shared/Authentication/Login.js';
import { Result } from '../../../../../../../src/Shared/Result/Result.js';
import { ErrorMessage } from '../../../../../../../src/Shared/Result/ErrorMessage.js';

function createHandler(login: IAuthenticationProvider['login']) {
    const authenticationProvider = { login } as unknown as IAuthenticationProvider;
    const pendingLoginStore = new PendingLoginStore();
    const handler = new LoginCommandHandler(authenticationProvider, pendingLoginStore);
    return { handler, pendingLoginStore };
}

describe('LoginCommandHandler', () => {
    test('stores the nonce and does not return it to the renderer', async () => {
        const { handler, pendingLoginStore } = createHandler(
            vi.fn().mockResolvedValue(Result.success({ userId: 'user-1', isVerified: true, nonceId: 'nonce-id', nonce: 'nonce' })),
        );

        const result = await handler.handle(new LoginCommand('test@mail.dk', 'password'));

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ userId: 'user-1', isVerified: true });
        expect(pendingLoginStore.get('user-1')).toEqual({ userId: 'user-1', nonceId: 'nonce-id', nonce: 'nonce' });
    });

    test('stores nothing for an unverified user', async () => {
        const { handler, pendingLoginStore } = createHandler(
            vi.fn().mockResolvedValue(Result.success({ userId: 'user-1', isVerified: false, nonceId: null, nonce: null })),
        );

        const result = await handler.handle(new LoginCommand('test@mail.dk', 'password'));

        expect(result.success).toBe(true);
        expect(pendingLoginStore.get('user-1')).toBeNull();
    });

    test('clears a previous pending login on a new successful login', async () => {
        const { handler, pendingLoginStore } = createHandler(
            vi.fn().mockResolvedValue(Result.success({ userId: 'user-2', isVerified: false, nonceId: null, nonce: null })),
        );
        pendingLoginStore.set({ userId: 'user-1', nonceId: 'old-id', nonce: 'old' });

        await handler.handle(new LoginCommand('test@mail.dk', 'password'));

        expect(pendingLoginStore.get('user-1')).toBeNull();
    });

    test('returns the failure and keeps no nonce when login fails', async () => {
        const { handler, pendingLoginStore } = createHandler(
            vi.fn().mockResolvedValue(Result.fail(new ErrorMessage('Bad Request', 'Invalid Credentials'))),
        );

        const result = await handler.handle(new LoginCommand('test@mail.dk', 'wrong'));

        expect(result.success).toBe(false);
        expect(pendingLoginStore.get('user-1')).toBeNull();
    });
});
