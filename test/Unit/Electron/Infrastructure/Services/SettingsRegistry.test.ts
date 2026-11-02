import { describe, expect, test } from 'vitest';
import { SettingsRegistry } from '../../../../../src/Electron/Infrastructure/Services/SettingsRegistry.js';

const repository = () => ({ get: async () => null, set: async () => {}, delete: async () => {} });

describe('settings registry', () => {
    test('emoji usage is account-scoped so purge wipes it, while appearance survives', () => {
        const appearance = repository();
        const emoji = repository();
        const notifications = repository();

        const sut = new SettingsRegistry(appearance as never, emoji as never, notifications as never);

        expect(sut.accountScoped()).toEqual([emoji]);
        expect(sut.get('emoji')).toBe(emoji);
        expect(sut.get('appearance')).toBe(appearance);
        expect(sut.get('notifications')).toBe(notifications);
    });
});
