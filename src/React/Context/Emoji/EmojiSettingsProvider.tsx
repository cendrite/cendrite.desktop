import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SkinTone } from 'frimousse';
import { EmojiSettingsContext } from './EmojiSettingsContext.tsx';
import { GetSettingsQuery } from '@/Shared/Settings/GetSettings.ts';
import { UpdateSettingsCommand } from '@/Shared/Settings/UpdateSettings.ts';
import { parseRecentEmoji, pushRecentEmoji } from '@/React/Common/Emoji/RecentEmoji.ts';

export const SKIN_TONES: SkinTone[] = ['none', 'light', 'medium-light', 'medium', 'medium-dark', 'dark'];

const parseSkinTone = (value: unknown): SkinTone => SKIN_TONES.find((t) => t === value) ?? 'none';

// Mounted inside the signed-in tree: the settings section is account-scoped and purged on logout,
// so state must be reloaded per session rather than outliving it in a root provider.
export const EmojiSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [skinTone, setSkinToneState] = useState<SkinTone>('none');
    const [recent, setRecent] = useState<string[]>([]);
    const recentRef = useRef<string[]>([]);
    const skinToneTouched = useRef(false);

    const updateRecent = (next: string[]) => {
        recentRef.current = next;
        setRecent(next);
    };

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetSettingsQuery('emoji')).then((result) => {
            if (cancelled || !result.success) return;
            // Choices made before the load finished win over what was stored.
            if (!skinToneTouched.current) setSkinToneState(parseSkinTone(result.data.skinTone));
            const stored = parseRecentEmoji(result.data.recent);
            updateRecent(recentRef.current.reduceRight((list, emoji) => pushRecentEmoji(list, emoji), stored));
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const setSkinTone = useCallback((next: SkinTone) => {
        skinToneTouched.current = true;
        setSkinToneState(next);
        // Fire and forget: a failed write must not revert what the user just picked.
        void window.electron.sendRequestAsync(new UpdateSettingsCommand('emoji', { skinTone: next }));
    }, []);

    const recordUsage = useCallback((emoji: string) => {
        const next = pushRecentEmoji(recentRef.current, emoji);
        updateRecent(next);
        void window.electron.sendRequestAsync(new UpdateSettingsCommand('emoji', { recent: next }));
    }, []);

    const value = useMemo(
        () => ({ skinTone, recent, setSkinTone, recordUsage }),
        [skinTone, recent, setSkinTone, recordUsage],
    );

    return <EmojiSettingsContext.Provider value={value}>{children}</EmojiSettingsContext.Provider>;
};

export default EmojiSettingsProvider;
