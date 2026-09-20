import React from 'react';
import { DialogTitle } from '@headlessui/react';
import { SettingsSection, settingsSections } from './SettingsSection.ts';

interface SettingsNavProps {
    active: SettingsSection;
    onSelect: (section: SettingsSection) => void;
}

const SettingsNav: React.FC<SettingsNavProps> = ({ active, onSelect }) => {
    return (
        <nav className="w-[200px] shrink-0 border-r border-zinc-600 p-3">
            <DialogTitle className="px-3 py-2 text-sm text-gray-500">Settings</DialogTitle>

            <ul className="mt-1 space-y-1">
                {settingsSections.map((section) => (
                    <li key={section.id}>
                        <button
                            onClick={() => onSelect(section.id)}
                            className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                                active === section.id
                                    ? 'bg-darkGray-300 text-white'
                                    : 'text-gray-400 hover:bg-darkGray-300 hover:text-gray-200'
                            }`}
                        >
                            {section.label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default SettingsNav;
