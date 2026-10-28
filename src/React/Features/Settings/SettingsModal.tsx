import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import SettingsNav from './SettingsNav.tsx';
import { SettingsSection, settingsSections } from './SettingsSection.ts';
import AccountSection from './Sections/AccountSection.tsx';
import AppearanceSection from './Sections/AppearanceSection.tsx';
import NotificationsSection from './Sections/NotificationsSection.tsx';
import PrivacySection from './Sections/PrivacySection.tsx';
import DevicesSection from './Sections/DevicesSection.tsx';
import { useDevices } from '@/React/Common/Hooks/Devices';
import { XIcon } from '@phosphor-icons/react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [active, setActive] = useState<SettingsSection>('account');
    const { devices, failed: devicesFailed, deleteDevice } = useDevices(isOpen);

    const sections: Record<SettingsSection, React.ReactNode> = {
        account: <AccountSection />,
        appearance: <AppearanceSection />,
        notifications: <NotificationsSection />,
        privacy: <PrivacySection />,
        devices: <DevicesSection devices={devices} failed={devicesFailed} onDelete={deleteDevice} />,
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[1000]">
            <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="flex w-[900px] h-[620px] max-w-[92vw] max-h-[88vh] overflow-hidden rounded-xl bg-surface text-fg shadow-lg">
                    <SettingsNav active={active} onSelect={setActive} />

                    <div className="relative flex-1 overflow-y-auto p-6">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-fg-subtle hover:text-fg-muted"
                            aria-label="Close settings"
                        >
                            <XIcon className="h-5 w-5" />
                        </button>

                        <h2 className="mb-4 text-lg font-semibold">
                            {settingsSections.find((s) => s.id === active)?.label}
                        </h2>

                        {sections[active]}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default SettingsModal;
