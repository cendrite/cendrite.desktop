import React, { useState } from 'react';
import { Cog6ToothIcon, ChatBubbleOvalLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import {
    ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconFilled,
    UserGroupIcon as UserGroupIconFilled,
} from '@heroicons/react/24/solid';
import SidePanelToggle from './SidePanelToggle';
import PanelButton from './SidePanelButton';
import UserModal from '../Modals/UserModal.tsx';
import NotificationBadge from '../../../Context/Notification/NotificationBadge.tsx';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';
import { useUser } from '../../../Context/User/UserContext.tsx';
import SettingsModal from '../../Settings/SettingsModal.tsx';

export interface SidePanelProps {
    onHide: () => void;
    setPaneType: (type: 'chats' | 'contacts') => void;
    paneType: 'chats' | 'contacts';
}

export const SidePanel: React.FC<SidePanelProps> = ({ onHide, setPaneType, paneType }) => {
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const { user } = useUser();

    return (
        <>
            <div className="bg-darkGray-500 text-white w-[60px] h-screen flex flex-col justify-between py-2 border-r border-zinc-600">
                {/* Top Icons: SidePanelToggle, Chat, Contacts */}
                <div className="flex flex-col items-center space-y-4">
                    {/* SidePanelToggle */}
                    <SidePanelToggle onClick={onHide} />

                    {/* Chat button */}
                    <div className="relative">
                        <PanelButton
                            onClick={() => setPaneType('chats')}
                            icon={<ChatBubbleOvalLeftIcon className="w-5 h-5 cursor-pointer hover:text-gray-300" />}
                            activeIcon={
                                <ChatBubbleOvalLeftIconFilled className="w-5 h-5 cursor-pointer text-gray-300" />
                            }
                            isActive={paneType === 'chats'}
                        />
                        {paneType !== 'chats' && <NotificationBadge section="chats" />}
                    </div>

                    {/* Contacts' button */}
                    <div className="relative">
                        <PanelButton
                            onClick={() => setPaneType('contacts')}
                            icon={<UserGroupIcon className="w-5 h-5" />}
                            activeIcon={<UserGroupIconFilled className="w-5 h-5 text-gray-300" />}
                            isActive={paneType === 'contacts'}
                        />
                        {paneType !== 'contacts' && <NotificationBadge section="contacts" />}
                    </div>
                </div>

                {/* Bottom Icons: User Profile and Settings */}
                <div className="flex flex-col items-center space-y-8 mb-2">
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
                        icon={<Cog6ToothIcon className="w-5 h-5" />}
                        activeIcon={<Cog6ToothIcon className="w-5 h-5 text-gray-300" />}
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
