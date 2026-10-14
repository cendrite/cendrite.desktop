import React from 'react';
import { useChatContext } from '@/React/Context/Chat/ChatContext.tsx';
import { ChatCard } from './ChatCard.tsx';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import CreateGroupButton from './CreateGroupButton.tsx';

export const ChatsPane: React.FC = () => {
    const { chatState } = useChatContext();

    return (
        <div className="text-fg p-2 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex-grow text-center">
                    <h2 className="text-lg font-bold">Chats</h2>
                </div>
                <CreateGroupButton contact={null} />
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
