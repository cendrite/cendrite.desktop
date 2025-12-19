import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import SidePanelToggle from '../SidePanel/SidePanelToggle';
import { useChatContext } from '../../../Context/Chat/ChatContext.tsx';
import { ChatCard } from './ChatCard.tsx';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';

interface ChatsPaneProps {
    isSidePanelVisible: boolean;
    toggleSidePanel: () => void;
}

export const ChatsPane: React.FC<ChatsPaneProps> = ({ isSidePanelVisible, toggleSidePanel }) => {
    const { chatState } = useChatContext();

    return (
        <div className="text-white p-2 relative">
            {/* Title and Top Buttons */}
            <div className="flex items-center justify-between mb-4">
                {/* Left Toggle Button */}
                {!isSidePanelVisible && <SidePanelToggle onClick={toggleSidePanel} />}

                {/* Chats Title */}
                <div className="flex-grow text-center">
                    <h2 className="text-lg font-bold">Chats</h2>
                </div>

                {/* Right Add Button */}
                <button className="p-2 rounded-md text-white hover:bg-zinc-600">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/*/!* Search Bar *!/*/}
            {/*<SearchBar />*/}

            {/* Chat List */}
            <ul className="mt-4 space-y-2">
                {chatState.chats.map((chat: ChatViewModel) => (
                    <li key={chat.id}>
                        <ChatCard chat={chat} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChatsPane;
