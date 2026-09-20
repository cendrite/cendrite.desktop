import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type SettingsSection = 'account' | 'appearance' | 'notifications' | 'privacy';

const sections: { id: SettingsSection; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
];

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [active, setActive] = useState<SettingsSection>('account');

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[1000]">
            <DialogBackdrop className="fixed inset-0 bg-black/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="flex w-[900px] h-[620px] max-w-[92vw] max-h-[88vh] overflow-hidden rounded-xl bg-darkGray-500 text-white shadow-lg">
                    <nav className="w-[200px] shrink-0 border-r border-zinc-600 p-3">
                        <DialogTitle className="px-3 py-2 text-sm text-gray-500">Settings</DialogTitle>

                        <ul className="mt-1 space-y-1">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => setActive(section.id)}
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

                    <div className="relative flex-1 overflow-y-auto p-6">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
                            aria-label="Close settings"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <h2 className="text-lg font-semibold">
                            {sections.find((s) => s.id === active)?.label}
                        </h2>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default SettingsModal;
