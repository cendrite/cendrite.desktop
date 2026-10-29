import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmojiSettingsContext } from './EmojiSettingsContext.tsx';
import { GetSettingsQuery } from '@/Shared/Settings/GetSettings.ts';
import { UpdateSettingsCommand } from '@/Shared/Settings/UpdateSettings.ts';
import { parseRecentEmoji, pushRecentEmoji } from '@/React/Common/Emoji/RecentEmoji.ts';

// Keyed by base emoji. Picking the default tone stores the base emoji rather than deleting the key,
// so a choice made before the stored settings load still wins the merge.
const parseSkinTones = (value: unknown): Record<string, string> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value).filter((e): e is [string, string] => typeof e[1] === 'string'))
        : {};

// Mounted inside the signed-in tree: the settings section is account-scoped and purged on logout,
// so state must be reloaded per session rather than outliving it in a root provider.
export const EmojiSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [skinTones, setSkinTones] = useState<Record<string, string>>({});
    const [recent, setRecent] = useState<string[]>([]);
    const skinTonesRef = useRef<Record<string, string>>({});
    const recentRef = useRef<string[]>([]);

    const updateSkinTones = (next: Record<string, string>) => {
        skinTonesRef.current = next;
        setSkinTones(next);
    };

    const updateRecent = (next: string[]) => {
        recentRef.current = next;
        setRecent(next);
    };

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetSettingsQuery('emoji')).then((result) => {
            if (cancelled || !result.success) return;
            // Choices made before the load finished win over what was stored.
            updateSkinTones({ ...parseSkinTones(result.data.skinTones), ...skinTonesRef.current });
            const stored = parseRecentEmoji(result.data.recent);
            updateRecent(recentRef.current.reduceRight((list, emoji) => pushRecentEmoji(list, emoji), stored));
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const setSkinTone = useCallback((emoji: string, variant: string) => {
        const next = { ...skinTonesRef.current, [emoji]: variant };
        updateSkinTones(next);
        // Fire and forget: a failed write must not revert what the user just picked.
        void window.electron.sendRequestAsync(new UpdateSettingsCommand('emoji', { skinTones: next }));
    }, []);

    const recordUsage = useCallback((emoji: string) => {
        const next = pushRecentEmoji(recentRef.current, emoji);
        updateRecent(next);
        void window.electron.sendRequestAsync(new UpdateSettingsCommand('emoji', { recent: next }));
    }, []);

    const value = useMemo(
        () => ({ skinTones, recent, setSkinTone, recordUsage }),
        [skinTones, recent, setSkinTone, recordUsage],
    );

    return <EmojiSettingsContext.Provider value={value}>{children}</EmojiSettingsContext.Provider>;
};

export default EmojiSettingsProvider;
