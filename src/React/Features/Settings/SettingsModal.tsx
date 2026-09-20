import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SettingsNav from './SettingsNav.tsx';
import { SettingsSection, settingsSections } from './SettingsSection.ts';
import AccountSection from './Sections/AccountSection.tsx';
import AppearanceSection from './Sections/AppearanceSection.tsx';
import NotificationsSection from './Sections/NotificationsSection.tsx';
import PrivacySection from './Sections/PrivacySection.tsx';

const sectionComponents: Record<SettingsSection, React.FC> = {
    account: AccountSection,
    appearance: AppearanceSection,
    notifications: NotificationsSection,
    privacy: PrivacySection,
};

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [active, setActive] = useState<SettingsSection>('account');
    const ActiveSection = sectionComponents[active];

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[1000]">
            <DialogBackdrop className="fixed inset-0 bg-black/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="flex w-[900px] h-[620px] max-w-[92vw] max-h-[88vh] overflow-hidden rounded-xl bg-darkGray-500 text-white shadow-lg">
                    <SettingsNav active={active} onSelect={setActive} />

                    <div className="relative flex-1 overflow-y-auto p-6">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
                            aria-label="Close settings"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <h2 className="mb-4 text-lg font-semibold">
                            {settingsSections.find((s) => s.id === active)?.label}
                        </h2>

                        <ActiveSection />
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default SettingsModal;
