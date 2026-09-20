import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LogoutModal from './LogoutModal.tsx';
import { useUser } from '../../../Context/User/UserContext.tsx';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';
import AvatarModal from './AvatarModal.tsx';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false);

    // Stay closed while a child modal is up so the two panels never stack; reopens by itself
    // once the child closes, which is why neither child needs to report back.
    const isChildOpen = isLogoutModalOpen || isProfilePictureModalOpen;

    return (
        <>
            <Dialog open={isOpen && !isChildOpen} onClose={onClose} className="relative z-[1000]">
                <DialogBackdrop className="fixed inset-0 bg-scrim/80" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative flex h-[550px] w-[350px] flex-col rounded-xl bg-surface p-4 text-fg shadow-lg">
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-3 top-3 text-fg-subtle hover:text-fg-muted"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>

                        <DialogTitle className="text-sm text-fg">Profile</DialogTitle>

                        <div className="mt-6 flex flex-col items-center">
                            <Avatar
                                className="w-20 h-20"
                                AvatarKey={user?.avatarKey ?? null}
                                Username={user?.username ?? '?'}
                            />

                            <button
                                className="text-sm text-link font-semibold hover:underline mt-2"
                                onClick={() => setIsProfilePictureModalOpen(true)}
                            >
                                Change Picture
                            </button>

                            <h2 className="text-lg font-semibold">{user?.displayName || user?.username}</h2>
                            <p className="text-sm text-fg-subtle mt-1">{user?.userTag}</p>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm text-fg-faint mb-1">Om</h3>
                            <p className="text-sm text-fg-subtle">
                                Din profil og ændringerne vil være synlige for folk, du skriver til, kontakter og
                                grupper.
                            </p>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm text-fg-faint mb-1">Brugernavn</h3>
                            <p className="text-sm text-fg-subtle">
                                Folk kan nu sende dig beskeder ved hjælp af dit valgfrie brugernavn, så du ikke behøver
                                at dele dit telefonnummer.
                            </p>
                        </div>

                        <div className="mt-auto flex items-center justify-center">
                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="text-[0.8rem] font-semibold bg-overlay rounded-full px-3.5 py-0.5 text-fg hover:bg-surface-hover"
                            >
                                Logout
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />

            <AvatarModal isOpen={isProfilePictureModalOpen} onClose={() => setIsProfilePictureModalOpen(false)} />
        </>
    );
};

export default UserModal;
