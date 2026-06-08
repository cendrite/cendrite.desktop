import React from 'react';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';
import { useHomePage } from '../../../Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '../../../Context/HomePage/HomePageReducer.ts';
import { useUser } from '../../../Context/User/UserContext.tsx';
import Avatar from '../../../Common/Components/Avatar/Avatar.tsx';

interface ChatCardProps {
    chat: ChatViewModel;
}

export const ChatCard: React.FC<ChatCardProps> = ({ chat }) => {
    const { selectedItem, homeDispatch } = useHomePage();
    const { user } = useUser();
    const unreadMessages = chat.getUnreadMessages(user!.connectionId);
    console.log('Rendering ChatCard for chat id:', chat.id, 'Unread messages:', unreadMessages.length);
    const isSelected = selectedItem.type === 'chat' && selectedItem.value.id === chat.id;
    const name = chat.chatMembers[0].displayName ?? chat.chatMembers[0].contact.displayName;
    const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;

    const onHandleClick = async () => {
        if (isSelected) {
            homeDispatch({ type: HomePageActionType.Clear }); 
            return;
        }
        homeDispatch({
            type: HomePageActionType.SetSelectedChat,
            payload: chat,
        });
    };

    const cardClasses = `flex items-center py-2 px-2 rounded-md cursor-pointer 
    ${isSelected ? 'bg-darkGray-300' : 'hover:bg-darkGray-300'}`;

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                    <Avatar
                        className="w-11 h-11"
                        AvatarKey={chat.chatMembers[0].contact.avatarKey}
                        Username={chat.chatMembers[0].contact.username}
                    />
            </div>
            <div className="ml-3 flex flex-col overflow-hidden">
                <div className="flex items-center">
                    <span className="text-sm text-white font-medium truncate max-w-[180px]">{name}</span>
                    {unreadMessages.length> 0 && !isSelected && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadMessages.length}
                        </span>
                    )}
                </div>
                <span
                    className={`text-xs truncate max-w-[220px] mt-0.5 
                ${chat.getUnreadMessagesCount(user!.connectionId) > 0 ? 'text-white' : 'text-gray-400'}
                ${lastMessage?.text ? 'font-normal' : 'italic'}`}
                >
                    {lastMessage?.text ?? 'draft..'}
                </span>
            </div>
        </div>
    );
};
