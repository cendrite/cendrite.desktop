import React, { useState } from 'react';
import Modal from 'react-modal';
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

    return (
        <>
            {!isLogoutModalOpen && !isProfilePictureModalOpen && (
                <Modal
                    isOpen={isOpen}
                    onRequestClose={onClose}
                    className="p-4 bg-surface text-fg rounded-xl shadow-lg w-[350px] h-[550px] max-auto relative"
                    overlayClassName="fixed inset-0 bg-scrim/80 flex justify-center items-center"
                    contentLabel="User Details"
                >
                    <div className="relative h-full flex flex-col">
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-1 right-1 text-fg-subtle hover:text-fg-muted">
                            ✕
                        </button>

                        <h3 className="absolute top-1 left-1 text-m text-fg">Profile</h3>

                        {/* Profile Section */}
                        <div className="flex flex-col items-center mt-8">
                            {/* Profile Picture */}
                            <Avatar
                                className="w-20 h-20"
                                AvatarKey={user?.avatarKey ?? null}
                                Username={user?.username ?? '?'}
                            />

                            {/* Edit Button */}
                            <button
                                className="text-sm text-link font-semibold hover:underline mt-2"
                                onClick={() => setIsProfilePictureModalOpen(true)}
                            >
                                Change Picture
                            </button>

                            {/* User Details */}
                            <h2 className="text-lg font-semibold">{user?.displayName || user?.username}</h2>
                            <p className="text-sm text-fg-subtle mt-1">{user?.userTag}</p>
                        </div>

                        {/* About Section */}
                        <div className="mt-6">
                            <h3 className="text-sm text-fg-faint mb-1">Om</h3>
                            <p className="text-sm text-fg-subtle">
                                Din profil og ændringerne vil være synlige for folk, du skriver til, kontakter og
                                grupper.
                            </p>
                        </div>

                        {/* Username Section */}
                        <div className="mt-6">
                            <h3 className="text-sm text-fg-faint mb-1">Brugernavn</h3>
                            <p className="text-sm text-fg-subtle">
                                Folk kan nu sende dig beskeder ved hjælp af dit valgfrie brugernavn, så du ikke behøver
                                at dele dit telefonnummer.
                            </p>
                        </div>

                        {/* Logout Section */}
                        <div className="flex justify-center items-center mt-auto">
                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="text-[0.8rem] font-semibold bg-overlay rounded-full px-3.5 py-0.5 text-fg hover:bg-surface-hover"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={(shouldReopenParent) => {
                    setIsLogoutModalOpen(false);
                    if (shouldReopenParent) {
                        return;
                    }
                    onClose();
                }}
            />

            <AvatarModal
                isOpen={isProfilePictureModalOpen}
                onClose={(shouldReopenParent) => {
                    setIsProfilePictureModalOpen(false);
                    if (shouldReopenParent) {
                        return;
                    }
                    onClose();
                }}
            />
        </>
    );
};

export default UserModal;
