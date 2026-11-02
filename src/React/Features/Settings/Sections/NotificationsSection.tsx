import React, { useEffect, useState } from 'react';
import { Description, Field, Label, Switch } from '@headlessui/react';
import { GetSettingsQuery } from '@/Shared/Settings/GetSettings.ts';
import { UpdateSettingsCommand } from '@/Shared/Settings/UpdateSettings.ts';
import { NotificationSettings } from '@/Shared/Settings/NotificationSettings.ts';

interface ToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, disabled = false, onChange }) => (
    <Field disabled={disabled} className="flex items-center justify-between gap-6 data-[disabled]:opacity-50">
        <div>
            <Label className="text-sm font-medium text-fg-muted">{label}</Label>
            <Description className="mt-1 text-sm text-fg-subtle">{description}</Description>
        </div>

        <Switch
            checked={checked}
            onChange={onChange}
            className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-line transition-colors data-[checked]:bg-accent data-[disabled]:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
            <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-fg-on-accent transition-transform group-data-[checked]:translate-x-6" />
        </Switch>
    </Field>
);

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
