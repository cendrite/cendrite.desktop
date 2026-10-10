import React from 'react';
import { Description, Label, Radio, RadioGroup } from '@headlessui/react';
import { Theme } from '../../../../Shared/Theme.ts';
import { useTheme } from '../../../Context/Theme/ThemeContext.tsx';
import ThemePreview from './ThemePreview.tsx';
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

const AppearanceSection: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <section>
            <h3 className="text-sm font-medium text-fg-muted">Theme</h3>
            <p className="mt-1 text-sm text-fg-subtle">Choose how Cypherly looks on this device.</p>

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
        </section>
    );
};

export default AppearanceSection;
