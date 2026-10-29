import { describe, expect, test } from 'vitest';
import { parseSettings } from '../../../../../../src/Electron/Application/Services/Settings/SettingsDefaults.js';

describe('emoji settings', () => {
    test('default to no skin tone and no recent emoji', () => {
        expect(parseSettings('emoji', null)).toEqual({ skinTones: {}, recent: [] });
    });

    test('keep stored values over the defaults', () => {
        const stored = JSON.stringify({ skinTones: { '👍': '👍🏽' }, recent: ['🔥'] });

        expect(parseSettings('emoji', stored)).toEqual({ skinTones: { '👍': '👍🏽' }, recent: ['🔥'] });
    });
});
