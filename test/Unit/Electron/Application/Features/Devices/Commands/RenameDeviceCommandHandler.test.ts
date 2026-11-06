import { describe, expect, test, vi } from 'vitest';
import { RenameDeviceCommandHandler } from '#electron/Application/Features/Devices/Commands/RenameDeviceCommandHandler';
import { RenameDeviceCommand } from '#shared/Devices/RenameDevice';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { Result } from '#shared/Result/Result';

function setup(renameResult: Result = Result.success()) {
    const provider = { renameDevice: vi.fn(async () => renameResult) };
    return { provider, sut: new RenameDeviceCommandHandler(provider as never) };
}

describe('renaming a device', () => {
    test('sends the trimmed name for the device', async () => {
        const { sut, provider } = setup();

        const result = await sut.handle(new RenameDeviceCommand('d1', '  Work laptop '));

        expect(result.success).toBe(true);
        expect(provider.renameDevice).toHaveBeenCalledWith('d1', 'Work laptop');
    });

    test('fails when the server rejects the rename', async () => {
        const { sut } = setup(Result.fail(new ErrorMessage(null, 'nope')));

        const result = await sut.handle(new RenameDeviceCommand('d1', 'Work laptop'));

        expect(result.success).toBe(false);
    });
});
