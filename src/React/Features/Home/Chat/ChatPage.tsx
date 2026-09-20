import React, { useEffect, useState } from 'react';
import ChatHeader from './ChatHeader.tsx';
import ChatBar from './ChatBar.tsx';
import { useChatContext } from '../../../Context/Chat/ChatContext.tsx';
import { DeliveryStatus } from '../../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { ChatActionType } from '../../../Context/Chat/ChatReducer.ts';
import { useMessageService } from '../../../Common/Hooks/MessageService.ts';
import MessageList from './MessageList.tsx';

interface ChatPageProps {
    chatId: string;
    onClose: () => void;
}
const ChatPage: React.FC<ChatPageProps> = ({ chatId, onClose }) => {
    const [slideClass, setSlideClass] = useState('translate-x-full');
    const { getChatById } = useChatContext();
    const currentChat = getChatById(chatId);
    const { markMessagesAsRead } = useMessageService();
    const { chatDispatch } = useChatContext();
    const lastMessage = currentChat.messages.at(-1);

    useEffect(() => {
        chatDispatch({ type: ChatActionType.SetActiveChat, payload: { chatId: chatId } });
        return () => {
            chatDispatch({ type: ChatActionType.ClearActiveChat });
        };
    }, [chatId, chatDispatch]);

    useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.deliveryStatus === DeliveryStatus.Read) return;
        markMessagesAsRead(currentChat).then((_) => _);
        // Intentionally keyed on chat id + newest message id, not the whole
        // currentChat / lastMessage objects, to avoid re-running on every chat
        // reference change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentChat.id, lastMessage?.id, markMessagesAsRead]);

    useEffect(() => {
        setSlideClass('translate-x-0');
    }, []);

    const handleSlide = () => {
        setSlideClass('translate-x-full');
        setTimeout(() => {
            onClose();
        }, 300);
    };

    return (
        <>
            <div className={`absolute inset-0  text-fg shadow-lg transition-transform duration-300 ${slideClass}`}>
                <div className="flex flex-col h-full">
                    <ChatHeader chat={currentChat} onClose={() => handleSlide()} />

                    <MessageList key={currentChat.id} chat={currentChat} />

                    <div className="sticky bottom-0 bg-canvas">
                        <ChatBar chat={currentChat} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatPage;
