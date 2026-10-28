import { describe, expect, test, vi } from 'vitest';
import { PurgeLocalDataService } from '../../../../../src/Electron/Infrastructure/Services/PurgeLocalDataService.js';

const cleared = () => ({ delete: vi.fn(), deleteAll: vi.fn(), clear: vi.fn() });

describe('purging local data', () => {
    test('clears the outbox and stored media along with the account data', async () => {
        const eventRepository = cleared();
        const mediaStore = cleared();
        const settingsRegistry = { accountScoped: () => [] };

        const sut = new PurgeLocalDataService(
            cleared() as never,
            cleared() as never,
            cleared() as never,
            cleared() as never,
            cleared() as never,
            settingsRegistry as never,
            cleared() as never,
            cleared() as never,
            cleared() as never,
            cleared() as never,
            eventRepository as never,
            mediaStore as never,
        );

        await sut.purgeLocalData();

        expect(eventRepository.deleteAll).toHaveBeenCalledOnce();
        expect(mediaStore.clear).toHaveBeenCalledOnce();
    });
});
