import React, { useState } from 'react';
import { Description, Label, Radio, RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Theme, DEFAULT_THEME } from '../../../../Shared/Theme.ts';
import ThemePreview from './ThemePreview.tsx';

const themeOptions: { id: Theme; label: string; description: string }[] = [
    { id: 'system', label: 'System', description: 'Match your operating system' },
    { id: 'light', label: 'Light', description: 'Always light' },
    { id: 'dark', label: 'Dark', description: 'Always dark' },
];

const AppearanceSection: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

    return (
        <section>
            <h3 className="text-sm font-medium text-gray-200">Theme</h3>
            <p className="mt-1 text-sm text-gray-400">Choose how Cypherly looks on this device.</p>

            <RadioGroup value={theme} onChange={setTheme} className="mt-4 grid grid-cols-3 gap-3">
                {themeOptions.map((option) => (
                    <Radio
                        key={option.id}
                        value={option.id}
                        className="cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        {({ checked }) => (
                            <div
                                className={`rounded-lg border p-2 ${
                                    checked
                                        ? 'border-blue-500 bg-darkGray-300'
                                        : 'border-zinc-700 hover:bg-darkGray-300'
                                }`}
                            >
                                <div className="h-16 overflow-hidden rounded ring-1 ring-black/20">
                                    <ThemePreview theme={option.id} />
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                    <Label className="text-sm text-white">{option.label}</Label>
                                    {checked && <CheckCircleIcon className="h-4 w-4 text-blue-500" />}
                                </div>

                                <Description className="text-xs text-gray-400">{option.description}</Description>
                            </div>
                        )}
                    </Radio>
                ))}
            </RadioGroup>
        </section>
    );
};

export default AppearanceSection;
