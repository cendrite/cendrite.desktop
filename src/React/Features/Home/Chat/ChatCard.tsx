import React from 'react';
import { ChatViewModel } from '@/React/Models/ChatViewModel.ts';
import { useHomePage } from '@/React/Context/HomePage/HomePageContext.tsx';
import { HomePageActionType } from '@/React/Context/HomePage/HomePageReducer.ts';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import Avatar from '@/React/Common/Components/Avatar/Avatar.tsx';
import AvatarStack from '@/React/Common/Components/Avatar/AvatarStack.tsx';

interface ChatCardProps {
    chat: ChatViewModel;
}

export const ChatCard: React.FC<ChatCardProps> = ({ chat }) => {
    const { selectedItem, homeDispatch } = useHomePage();
    const { user } = useUser();
    const unreadMessages = chat.getUnreadMessages(user!.connectionId);
    const isSelected = selectedItem.type === 'chat' && selectedItem.value.id === chat.id;
    const name = chat.isGroup ? chat.displayName : (chat.chatMembers[0]?.name ?? "?");
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
    ${isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`;

    return (
        <div className={cardClasses} onClick={onHandleClick}>
            {chat.isGroup ? (
                <AvatarStack className="w-11 h-11" members={chat.chatMembers} />
            ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-media">
                    <Avatar
                        className="w-11 h-11"
                        AvatarKey={chat.chatMembers[0]?.contact?.avatarKey ?? null}
                        Username={name}
                    />
                </div>
            )}
            <div className="ml-3 flex flex-col overflow-hidden">
                <div className="flex items-center">
                    <span className="text-sm text-fg font-medium truncate max-w-[180px]">{name}</span>
                    {unreadMessages.length> 0 && !isSelected && (
                        <span className="ml-2 bg-danger text-fg-on-accent text-xs px-2 py-0.5 rounded-full">
                            {unreadMessages.length}
                        </span>
                    )}
                </div>
                <span
                    className={`text-xs truncate max-w-[220px] mt-0.5 
                ${chat.getUnreadMessagesCount(user!.connectionId) > 0 ? 'text-fg' : 'text-fg-subtle'}
                ${lastMessage?.text ? 'font-normal' : 'italic'}`}
                >
                    {lastMessage?.text ?? 'draft..'}
                </span>
            </div>
        </div>
    );
};
