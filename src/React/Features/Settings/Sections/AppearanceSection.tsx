import React, { useEffect, useState } from 'react';
import { Description, Label, Radio, RadioGroup } from '@headlessui/react';
import { Theme } from '@/Shared/Theme.ts';
import { useTheme } from '@/React/Context/Theme/ThemeContext.tsx';
import ThemePreview from './ThemePreview.tsx';
import ToggleRow from '../Components/ToggleRow.tsx';
import { GetSettingsQuery } from '@/Shared/Settings/GetSettings.ts';
import { SetMenuBarVisibleCommand } from '@/Shared/Settings/SetMenuBarVisible.ts';
import { CheckCircleIcon } from '@phosphor-icons/react';

const themeOptions: { id: Theme; label: string; description: string }[] = [
    { id: 'system', label: 'System', description: 'Match your operating system' },
    { id: 'light', label: 'Light', description: 'Always light' },
    { id: 'dark', label: 'Dark', description: 'True black' },
    { id: 'gruvbox', label: 'Gruvbox', description: 'Warm retro palette' },
    { id: 'gruvbox-light', label: 'Gruvbox Light', description: 'Cream and warm' },
    { id: 'kanagawa', label: 'Kanagawa', description: 'Muted ink and blue' },
    { id: 'rose-pine', label: 'Rosé Pine', description: 'Soft mauve and pine' },
];

const hasWindowMenuBar = window.electron.platform !== 'darwin';

const AppearanceSection: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [showMenuBar, setShowMenuBar] = useState<boolean | null>(null);

    useEffect(() => {
        if (!hasWindowMenuBar) return;
        let cancelled = false;

        window.electron.sendRequestAsync(new GetSettingsQuery('appearance')).then((result) => {
            if (cancelled || !result.success) return;
            setShowMenuBar(result.data.showMenuBar !== false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const changeMenuBar = (visible: boolean) => {
        setShowMenuBar(visible);
        void window.electron.sendRequestAsync(new SetMenuBarVisibleCommand(visible));
    };

    return (
        <section>
            <h3 className="text-sm font-medium text-fg-muted">Theme</h3>
            <p className="mt-1 text-sm text-fg-subtle">Choose how Cendrite looks on this device.</p>

            <RadioGroup value={theme} onChange={setTheme} className="mt-4 grid grid-cols-3 gap-3">
                {themeOptions.map((option) => (
                    <Radio
                        key={option.id}
                        value={option.id}
                        className="cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        {({ checked }) => (
                            <div
                                className={`rounded-lg border p-2 ${
                                    checked ? 'border-accent bg-surface-hover' : 'border-line hover:bg-surface-hover'
                                }`}
                            >
                                <div className="h-16 overflow-hidden rounded ring-1 ring-line">
                                    <ThemePreview theme={option.id} />
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                    <Label className="text-sm text-fg">{option.label}</Label>
                                    {checked && <CheckCircleIcon weight="fill" className="h-4 w-4 text-accent" />}
                                </div>

                                <Description className="text-xs text-fg-subtle">{option.description}</Description>
                            </div>
                        )}
                    </Radio>
                ))}
            </RadioGroup>

            {hasWindowMenuBar && showMenuBar !== null && (
                <div className="mt-8">
                    <h3 className="text-sm font-medium text-fg-muted">Window</h3>
                    <div className="mt-4">
                        <ToggleRow
                            label="Show menu bar"
                            description="The File, Edit, View and Window bar at the top of the window. Keyboard shortcuts keep working when it's hidden."
                            checked={showMenuBar}
                            onChange={changeMenuBar}
                        />
                    </div>
                </div>
            )}
        </section>
    );
};

export default AppearanceSection;
