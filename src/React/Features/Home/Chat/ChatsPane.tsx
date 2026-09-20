import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useChatContext } from '../../../Context/Chat/ChatContext.tsx';
import { ChatCard } from './ChatCard.tsx';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';

export const ChatsPane: React.FC = () => {
    const { chatState } = useChatContext();

    return (
        <div className="text-fg p-2 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex-grow text-center">
                    <h2 className="text-lg font-bold">Chats</h2>
                </div>

                <button className="p-2 rounded-md text-fg hover:bg-surface-hover">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/*/!* Search Bar *!/*/}
            {/*<SearchBar />*/}

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
