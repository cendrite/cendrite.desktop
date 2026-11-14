import { describe, expect, test, vi } from 'vitest';
import { RemoveAvatarCommandHandler } from '#electron/Application/Features/User/Commands/RemoveAvatarCommandHandler';
import { RemoveAvatarCommand } from '#shared/User/RemoveAvatar';
import { User } from '#electron/Domain/Aggregates/User';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';

function setup(removeResult: Result<void> = Result.success()) {
    const user = new User('user-1', 'alice', '482177301593', 'avatar-key', null);
    const userRepository = { get: vi.fn(async () => user), update: vi.fn(async () => undefined) };
    const userProvider = { removeAvatar: vi.fn(async () => removeResult) };

    return { user, userRepository, sut: new RemoveAvatarCommandHandler(userRepository as never, userProvider as never) };
}

describe('removing the avatar', () => {
    test('clears the local avatar once the server removed it', async () => {
        const { sut, user, userRepository } = setup();

        const result = await sut.handle(new RemoveAvatarCommand());

        expect(result.success).toBe(true);
        expect(user.avatarKey).toBeNull();
        expect(userRepository.update).toHaveBeenCalledWith(user);
    });

    test('keeps the local avatar when the server refuses', async () => {
        const { sut, user, userRepository } = setup(Result.fail(new ErrorMessage(null, 'nope')));

        const result = await sut.handle(new RemoveAvatarCommand());

        expect(result.success).toBe(false);
        expect(user.avatarKey).toBe('avatar-key');
        expect(userRepository.update).not.toHaveBeenCalled();
    });
});
