import { describe, expect, test } from 'vitest';
import { parseSettings } from '../../../../../../src/Electron/Application/Features/Settings/SettingsDefaults.js';

describe('emoji settings', () => {
    test('default to no skin tone and no recent emoji', () => {
        expect(parseSettings('emoji', null)).toEqual({ skinTone: 'none', recent: [] });
    });

    test('keep stored values over the defaults', () => {
        const stored = JSON.stringify({ skinTone: 'medium', recent: ['🔥'] });

        expect(parseSettings('emoji', stored)).toEqual({ skinTone: 'medium', recent: ['🔥'] });
    });
});
