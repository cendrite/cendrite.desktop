import { describe, expect, test, vi } from 'vitest';
import { ResendVerificationCodeCommandHandler } from '../../../../../../../src/Electron/Application/Features/Authentication/Commands/ResendVerificationCodeCommandHandler.js';
import { IAuthenticationProvider } from '../../../../../../../src/Electron/Application/Contracts/Providers/IAuthenticationProvider.js';
import { PendingLoginStore } from '../../../../../../../src/Electron/Infrastructure/Services/PendingLoginStore.js';
import { ResendVerificationCodeCommand } from '../../../../../../../src/Shared/Authentication/ResendVerificationCode.js';
import { CodeType } from '../../../../../../../src/Shared/Enums/CodeType.js';
import { Result } from '../../../../../../../src/Shared/Result/Result.js';

function createHandler() {
    const resendVerificationCode = vi.fn().mockResolvedValue(Result.success());
    const authenticationProvider = { resendVerificationCode } as unknown as IAuthenticationProvider;
    const pendingLoginStore = new PendingLoginStore();
    const handler = new ResendVerificationCodeCommandHandler(authenticationProvider, pendingLoginStore);
    return { handler, pendingLoginStore, resendVerificationCode };
}

describe('ResendVerificationCodeCommandHandler', () => {
    test('sends email verification resend without a nonce', async () => {
        const { handler, resendVerificationCode } = createHandler();

        const result = await handler.handle(new ResendVerificationCodeCommand('user-1', CodeType.EmailVerification));

        expect(result.success).toBe(true);
        expect(resendVerificationCode).toHaveBeenCalledWith({ userId: 'user-1', codeType: CodeType.EmailVerification });
    });

    test('sends the pending nonce for a login resend', async () => {
        const { handler, pendingLoginStore, resendVerificationCode } = createHandler();
        pendingLoginStore.set({ userId: 'user-1', nonceId: 'nonce-id', nonce: 'nonce' });

        const result = await handler.handle(new ResendVerificationCodeCommand('user-1', CodeType.Login));

        expect(result.success).toBe(true);
        expect(resendVerificationCode).toHaveBeenCalledWith({
            userId: 'user-1',
            codeType: CodeType.Login,
            nonceId: 'nonce-id',
            nonce: 'nonce',
        });
    });

    test('fails with Unauthorized when there is no pending login', async () => {
        const { handler, resendVerificationCode } = createHandler();

        const result = await handler.handle(new ResendVerificationCodeCommand('user-1', CodeType.Login));

        expect(result.success).toBe(false);
        expect(result.errorMessage?.code).toBe('Unauthorized');
        expect(resendVerificationCode).not.toHaveBeenCalled();
    });
});
