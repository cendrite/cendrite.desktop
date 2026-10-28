import React, { useState } from 'react';
import { SignOutIcon } from '@phosphor-icons/react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import LogoutModal from '../Modals/LogoutModal.tsx';

const AccountSection: React.FC = () => {
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    return (
        <section>
            <h3 className="text-sm font-medium text-fg-muted">Session</h3>
            <p className="mt-1 text-sm text-fg-subtle">Manage how this device is signed in to your account.</p>

            <div className="mt-4 flex items-center gap-4 rounded-lg border border-line px-4 py-4">
                <SignOutIcon className="h-8 w-8 shrink-0 text-fg-muted" />

                <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">Log out</p>
                    <p className="mt-0.5 text-xs text-fg-subtle">Sign out of your account on this device.</p>
                </div>

                <Button variant="danger" className="ml-auto shrink-0" onClick={() => setIsLogoutModalOpen(true)}>
                    Log out
                </Button>
            </div>

            <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
        </section>
    );
};

export default AccountSection;
