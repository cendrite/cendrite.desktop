import React, { useState } from 'react';
import SidePanelToggle from './SidePanelToggle';
import PanelButton from './SidePanelButton';
import UserModal from '../Modals/UserModal.tsx';
import NotificationBadge from '@/React/Context/Notification/NotificationBadge.tsx';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import SettingsModal from '@/React/Features/Settings/SettingsModal.tsx';
import { AddressBookIcon, ChatCircleIcon, GearSixIcon } from '@phosphor-icons/react';

export interface SidePanelProps {
    onTogglePane: () => void;
    setPaneType: (type: 'chats' | 'contacts') => void;
    paneType: 'chats' | 'contacts';
}

export const SidePanel: React.FC<SidePanelProps> = ({ onTogglePane, setPaneType, paneType }) => {
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const { user } = useUser();

    return (
        <>
            <div className="bg-surface text-fg w-[60px] h-screen flex flex-col justify-between py-2 border-r border-line">
                {/* Top Icons: SidePanelToggle, Chat, Contacts */}
                <div className="flex flex-col items-center space-y-4">
                    {/* SidePanelToggle */}
                    <SidePanelToggle onClick={onTogglePane} />

                    {/* Chat button */}
                    <div className="relative">
                        <PanelButton
                            onClick={() => setPaneType('chats')}
                            icon={<ChatCircleIcon className="w-5 h-5 cursor-pointer hover:text-fg-muted" />}
                            activeIcon={
                                <ChatCircleIcon weight="fill" className="w-5 h-5 cursor-pointer text-fg-muted" />
                            }
                            isActive={paneType === 'chats'}
                        />
                        {paneType !== 'chats' && <NotificationBadge section="chats" />}
                    </div>

                    {/* Contacts' button */}
                    <div className="relative">
                        <PanelButton
                            onClick={() => setPaneType('contacts')}
                            icon={<AddressBookIcon className="w-5 h-5" />}
                            activeIcon={<AddressBookIcon weight="fill" className="w-5 h-5 text-fg-muted" />}
                            isActive={paneType === 'contacts'}
                        />
                        {paneType !== 'contacts' && <NotificationBadge section="contacts" />}
                    </div>
                </div>

                {/* Bottom Icons: User Profile and Settings */}
                <div className="flex flex-col items-center space-y-4">
                    <PanelButton
                        onClick={() => setUserModalOpen(true)}
                        icon={
                            <Avatar
                                className="w-8 h-8"
                                AvatarKey={user?.avatarKey ?? null}
                                Username={user?.displayName ?? user?.username ?? '?'}
                            />
                        }
                        activeIcon={
                            <Avatar
                                className="w-8 h-8"
                                AvatarKey={user?.avatarKey ?? null}
                                Username={user?.displayName ?? user?.username ?? '?'}
                            />
                        }
                        isActive={isUserModalOpen}
                    />
                    <PanelButton
                        onClick={() => setSettingsModalOpen(true)}
                        icon={<GearSixIcon className="w-5 h-5" />}
                        activeIcon={<GearSixIcon className="w-5 h-5 text-fg-muted" />}
                        isActive={isSettingsModalOpen}
                    />
                </div>
            </div>
            <UserModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
        </>
    );
};

export default SidePanel;
