import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({
    app: { getAppPath: () => '/opt/cypherly/resources/app.asar' },
}));

const { getAppUrl, isAppUrl } = await import('../../../src/Electron/Utilities.js');

const originalEnv = { NODE_ENV: process.env.NODE_ENV, VITE_PORT: process.env.VITE_PORT };

afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.VITE_PORT = originalEnv.VITE_PORT;
});

describe('isAppUrl in production', () => {
    test('loads the bundled index.html', () => {
        process.env.NODE_ENV = 'production';

        expect(getAppUrl()).toBe('file:///opt/cypherly/resources/app.asar/dist-react/index.html');
    });

    test('accepts the bundled page, including its hash routes', () => {
        process.env.NODE_ENV = 'production';

        expect(isAppUrl('file:///opt/cypherly/resources/app.asar/dist-react/index.html')).toBe(true);
        expect(isAppUrl('file:///opt/cypherly/resources/app.asar/dist-react/index.html#/home')).toBe(true);
    });

    test('rejects other local files and remote pages', () => {
        process.env.NODE_ENV = 'production';

        expect(isAppUrl('file:///etc/passwd')).toBe(false);
        expect(isAppUrl('file:///opt/cypherly/resources/app.asar/dist-react/other.html')).toBe(false);
        expect(isAppUrl('https://evil.example/index.html')).toBe(false);
    });

    test('rejects input that is not a URL', () => {
        process.env.NODE_ENV = 'production';

        expect(isAppUrl('not a url')).toBe(false);
    });
});

describe('isAppUrl in development', () => {
    test('accepts the Vite dev server on the configured port', () => {
        process.env.NODE_ENV = 'development';
        process.env.VITE_PORT = '8081';

        expect(getAppUrl()).toBe('http://localhost:8081/');
        expect(isAppUrl('http://localhost:8081/#/login')).toBe(true);
    });

    test('rejects another port or host', () => {
        process.env.NODE_ENV = 'development';
        process.env.VITE_PORT = '8081';

        expect(isAppUrl('http://localhost:9999/')).toBe(false);
        expect(isAppUrl('http://evil.example:8081/')).toBe(false);
    });
});
