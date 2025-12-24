import React, { Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';
import { useChatSettings } from '../../../Common/Hooks/ChatSettings.ts';

interface ChatSettingsButtonProps {
    chat: ChatViewModel;
}

const menuButtonClass = 'w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-darkGray-300 rounded-md';

const ChatSettingsButton: React.FC<ChatSettingsButtonProps> = ({ chat }) => {
    const { deleteChat } = useChatSettings();

    return (
        <Menu as="div" className="relative z-[1000]">
            {({ open, close }) => (
                <>
                    {open && (
                        <div
                            className="fixed inset-0 z-[900] bg-black/20 backdrop-blur-sm"
                            onClick={close}
                            aria-hidden="true"
                        />
                    )}

                    <div className="relative z-[1100]">
                        <MenuButton
                            className="flex items-center justify-center hover:bg-darkGray-300 rounded-lg p-2"
                            aria-label="Chat settings"
                        >
                            <EllipsisHorizontalIcon className="w-5 h-5 text-gray-200" />
                        </MenuButton>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-120"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-100"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-darkGray-200 shadow-lg ring-1 ring-black/20 focus:outline-none p-2 z-[1100]">
                                <MenuItem>
                                    {({ focus }) => (
                                        <button
                                            className={`${menuButtonClass} ${focus ? 'bg-darkGray-300' : ''}`}
                                            onClick={() => {
                                                close();
                                                console.log('Archive', chat.id);
                                            }}
                                        >
                                            Archive chat
                                        </button>
                                    )}
                                </MenuItem>

                                <MenuItem>
                                    {({ focus }) => (
                                        <button
                                            className={`${menuButtonClass} ${focus ? 'bg-darkGray-300' : ''}`}
                                            onClick={() => {
                                                close();
                                                console.log('Mute', chat.id);
                                            }}
                                        >
                                            Mute notifications
                                        </button>
                                    )}
                                </MenuItem>

                                <div className="my-1 h-px bg-white/10" />

                                <MenuItem>
                                    {({ focus }) => (
                                        <button
                                            className={`${menuButtonClass} ${focus ? 'bg-red-500/20' : ''} text-red-300 hover:text-red-200`}
                                            onClick={async () => {
                                                close();
                                                await deleteChat(chat);
                                            }}
                                        >
                                            Delete chat
                                        </button>
                                    )}
                                </MenuItem>
                            </MenuItems>
                        </Transition>
                    </div>
                </>
            )}
        </Menu>
    );
};

export default ChatSettingsButton;

