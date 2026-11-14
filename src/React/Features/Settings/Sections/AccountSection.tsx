import React, { useState } from 'react';
import { SignOutIcon } from '@phosphor-icons/react';
import Button from '@/React/Common/Components/Button/Button.tsx';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { formatUserTag } from '@/React/Common/Utilities.ts';
import LogoutModal from '../Modals/LogoutModal.tsx';
import AvatarModal from '../Modals/AvatarModal.tsx';

const AccountSection: React.FC = () => {
    const { user } = useUser();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    return (
        <section>
            <h3 className="text-sm font-medium text-fg-muted">Profile</h3>
            <p className="mt-1 text-sm text-fg-subtle">Your picture and name are visible to your contacts and groups.</p>

            <div className="mt-4 flex items-center gap-4 rounded-lg border border-line px-4 py-4">
                <Avatar
                    className="h-14 w-14 shrink-0"
                    AvatarKey={user?.avatarKey ?? null}
                    Username={user?.displayName ?? user?.username ?? '?'}
                />

                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{user?.displayName || user?.username}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle tabular-nums">{user ? formatUserTag(user.userTag) : null}</p>
                </div>

                <Button variant="secondary" className="ml-auto shrink-0" onClick={() => setIsAvatarModalOpen(true)}>
                    Change picture
                </Button>
            </div>

            <h3 className="mt-8 text-sm font-medium text-fg-muted">Session</h3>
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

            <AvatarModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} />
            <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
        </section>
    );
};

export default AccountSection;
