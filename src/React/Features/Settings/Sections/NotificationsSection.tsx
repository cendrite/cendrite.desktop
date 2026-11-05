import React, { useEffect, useState } from 'react';
import ToggleRow from '../Components/ToggleRow.tsx';
import { GetSettingsQuery } from '@/Shared/Settings/GetSettings.ts';
import { UpdateSettingsCommand } from '@/Shared/Settings/UpdateSettings.ts';
import { NotificationSettings } from '@/Shared/Settings/NotificationSettings.ts';

const NotificationsSection: React.FC = () => {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetSettingsQuery('notifications')).then((result) => {
            if (cancelled || !result.success) return;
            setSettings({
                enabled: result.data.enabled !== false,
                showMessagePreview: result.data.showMessagePreview === true,
            });
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const update = (patch: Partial<NotificationSettings>) => {
        setSettings((current) => (current ? { ...current, ...patch } : current));
        void window.electron.sendRequestAsync(new UpdateSettingsCommand('notifications', patch));
    };

    if (!settings) return null;

    return (
        <section className="space-y-5">
            <ToggleRow
                label="Show notifications"
                description="Show a system notification when a message arrives while Cendrite is in the background."
                checked={settings.enabled}
                onChange={(enabled) => update({ enabled })}
            />

            <ToggleRow
                label="Show message preview"
                description="Include message text in system notifications. Your notification daemon may keep a history of what it shows."
                checked={settings.showMessagePreview}
                disabled={!settings.enabled}
                onChange={(showMessagePreview) => update({ showMessagePreview })}
            />
        </section>
    );
};

export default NotificationsSection;
