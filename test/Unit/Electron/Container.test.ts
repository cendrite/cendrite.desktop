import { beforeAll, describe, expect, test, vi } from 'vitest';
import { BrowserWindow } from 'electron';

// Electron's app and the OS keyring are unavailable in a test process, and neither matters for wiring.
vi.mock('electron', () => ({
    app: { getPath: () => '/tmp/cypherly-container-test' },
    BrowserWindow: class {},
}));

vi.mock('../../../src/Electron/Infrastructure/Persistence/Encryption/CryptographyService.js', () => ({
    CryptographyService: {
        getInstance: () => ({ encrypt: async (v: string) => v, decrypt: async (v: string) => v }),
    },
}));

import { buildContainer } from '../../../src/Electron/Container.js';
import { initializeDatabase } from '../../../src/Electron/Infrastructure/Persistence/Context/DatabaseContext.js';

/**
 * Resolving every registration is the only thing that catches a dependency cycle: the unit tests
 * construct these classes directly and never go through awilix.
 */
beforeAll(async () => {
    await initializeDatabase(':memory:');
});

describe('the container', () => {
    test('resolves every registration without a cycle', () => {
        const container = buildContainer({ webContents: { send: () => {} } } as unknown as BrowserWindow);

        const failures: string[] = [];

        for (const name of Object.keys(container.registrations)) {
            try {
                container.resolve(name);
            } catch (error) {
                failures.push(`${name}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
            }
        }

        expect(failures).toEqual([]);
    });
});
