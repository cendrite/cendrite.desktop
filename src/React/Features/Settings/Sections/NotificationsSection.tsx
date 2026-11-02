import React, { useEffect, useState } from 'react';
import { Description, Field, Label, Switch } from '@headlessui/react';
import { GetSettingsQuery } from '@/Shared/Settings/GetSettings.ts';
import { UpdateSettingsCommand } from '@/Shared/Settings/UpdateSettings.ts';

const NotificationsSection: React.FC = () => {
    const [showMessagePreview, setShowMessagePreview] = useState(false);

    useEffect(() => {
        let cancelled = false;

        window.electron.sendRequestAsync(new GetSettingsQuery('notifications')).then((result) => {
            if (cancelled || !result.success) return;
            setShowMessagePreview(result.data.showMessagePreview === true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const onChange = (value: boolean) => {
        setShowMessagePreview(value);
        void window.electron.sendRequestAsync(
            new UpdateSettingsCommand('notifications', { showMessagePreview: value }),
        );
    };

    return (
        <section>
            <Field className="flex items-center justify-between gap-6">
                <div>
                    <Label className="text-sm font-medium text-fg-muted">Show message preview</Label>
                    <Description className="mt-1 text-sm text-fg-subtle">
                        Include message text in system notifications. Your notification daemon may keep a history
                        of what it shows.
                    </Description>
                </div>

                <Switch
                    checked={showMessagePreview}
                    onChange={onChange}
                    className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-line transition-colors data-[checked]:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                    <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-fg-on-accent transition-transform group-data-[checked]:translate-x-6" />
                </Switch>
            </Field>
        </section>
    );
};

export default NotificationsSection;
