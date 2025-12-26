import React, { useEffect, useState } from 'react';
import ChatHeader from './ChatHeader.tsx';
import ChatBar from './ChatBar.tsx';
import { useChatContext } from '../../../Context/Chat/ChatContext.tsx';
import MessageList from './MessageList.tsx';
import { DeliveryStatus } from '../../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { ChatActionType } from '../../../Context/Chat/ChatReducer.ts';
import { useMessageService } from '../../../Common/Hooks/MessageService.ts';

interface ChatPageProps {
    chatId: string;
    onClose: () => void;
}
const ChatPage: React.FC<ChatPageProps> = ({ chatId, onClose }) => {
    const [slideClass, setSlideClass] = useState('translate-x-full');
    const [message, setMessage] = useState<string>('');
    const { getChatById } = useChatContext();
    const currentChat = getChatById(chatId);
    const { sendMessage, markMessagesAsRead } = useMessageService();
    const { chatDispatch } = useChatContext();

    useEffect(() => {
        chatDispatch({ type: ChatActionType.SetActiveChat, payload: { chatId: chatId } });
        return () => {
            chatDispatch({ type: ChatActionType.ClearActiveChat });
        };
    }, [chatId, chatDispatch]);

    useEffect(() => {
        const lastMessage = currentChat.messages.at(-1);
        if (!lastMessage) return;
        if (lastMessage.deliveryStatus === DeliveryStatus.Read) return;
        markMessagesAsRead(currentChat).then((_) => _);
    }, [currentChat.id, currentChat.messages.at(-1)?.id, markMessagesAsRead]);

    useEffect(() => {
        setSlideClass('translate-x-0');
    }, []);

    const handleSlide = () => {
        setSlideClass('translate-x-full');
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const onSendMessage = async (text: string): Promise<void> => {
        if (!text.trim()) return;
        await sendMessage(currentChat, text, null);
    };

    return (
        <>
            <div className={`absolute inset-0  text-white shadow-lg transition-transform duration-300 ${slideClass}`}>
                <div className="flex flex-col h-full">
                    <ChatHeader chat={currentChat} onClose={() => handleSlide()} />

                    <MessageList chat={currentChat} />

                    <div className="sticky bottom-0 bg-zinc-950">
                        <ChatBar sendMessage={onSendMessage} message={message} setMessage={setMessage} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatPage;
