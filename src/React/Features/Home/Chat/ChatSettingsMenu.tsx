import React, { Fragment, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { useChatSettings } from '@/React/Common/Hooks/ChatSettings.ts';
import { useGroupEditable } from '@/React/Common/Hooks/GroupEditable.ts';
import AddMemberModal from '../Modals/AddMemberModal.tsx';
import RenameGroupModal from '../Modals/RenameGroupModal.tsx';
import { DotsThreeIcon } from '@phosphor-icons/react';

interface ChatSettingsMenu {
    chat: ChatViewModel;
}

const menuButtonClass = 'w-full text-left px-3 py-2 text-sm text-fg-muted hover:bg-surface-hover rounded-md';

const ChatSettingsMenu: React.FC<ChatSettingsMenu> = ({ chat }) => {
    const { deleteChat } = useChatSettings();
    const editable = useGroupEditable(chat.id);
    const [addingMember, setAddingMember] = useState(false);
    const [renaming, setRenaming] = useState(false);

    return (
        <>
            <Menu as="div" className="relative z-[1000]">
                {({ open, close }) => (
                    <>
                        {open && (
                            <div
                                className="fixed inset-0 z-[900] bg-scrim/20 backdrop-blur-sm"
                                onClick={close}
                                aria-hidden="true"
                            />
                        )}

                        <div className="relative z-[1100]">
                            <MenuButton
                                className="flex items-center justify-center hover:bg-surface-hover rounded-lg p-2"
                                aria-label="Chat settings"
                            >
                                <DotsThreeIcon weight="bold" className="w-5 h-5 text-fg-muted" />
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
                                <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-overlay shadow-lg ring-1 ring-line focus:outline-none p-2 z-[1100]">
                                    {chat.isGroup && (
                                        <MenuItem disabled={!editable}>
                                            {({ focus }) => (
                                                <button
                                                    disabled={!editable}
                                                    className={`${menuButtonClass} ${focus ? 'bg-surface-hover' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
                                                    onClick={() => {
                                                        close();
                                                        setAddingMember(true);
                                                    }}
                                                >
                                                    Add member
                                                </button>
                                            )}
                                        </MenuItem>
                                    )}

                                    {chat.isGroup && (
                                        <MenuItem disabled={!editable}>
                                            {({ focus }) => (
                                                <button
                                                    disabled={!editable}
                                                    className={`${menuButtonClass} ${focus ? 'bg-surface-hover' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
                                                    onClick={() => {
                                                        close();
                                                        setRenaming(true);
                                                    }}
                                                >
                                                    Rename group
                                                </button>
                                            )}
                                        </MenuItem>
                                    )}

                                    <MenuItem>
                                        {({ focus }) => (
                                            <button
                                                className={`${menuButtonClass} ${focus ? 'bg-surface-hover' : ''}`}
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
                                                className={`${menuButtonClass} ${focus ? 'bg-surface-hover' : ''}`}
                                                onClick={() => {
                                                    close();
                                                    console.log('Mute', chat.id);
                                                }}
                                            >
                                                Mute notifications
                                            </button>
                                        )}
                                    </MenuItem>

                                    <div className="my-1 h-px bg-line" />

                                    <MenuItem>
                                        {({ focus }) => (
                                            <button
                                                className={`${menuButtonClass} ${focus ? 'bg-danger/20' : ''} text-danger-fg hover:text-danger-fg-hover`}
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

            <AddMemberModal chat={chat} isOpen={addingMember} onClose={() => setAddingMember(false)} />
            <RenameGroupModal chat={chat} isOpen={renaming} onClose={() => setRenaming(false)} />
        </>
    );
};

export default ChatSettingsMenu;
