import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { MessageViewModel } from '../../../Models/MessageViewModel.ts';
import MessageBubble from './MessageBubble.tsx';
import { useUser } from '../../../Context/User/UserContext.tsx';
import { useChatContext } from '../../../Context/Chat/ChatContext.tsx';
import { useMessageService } from '../../../Common/Hooks/MessageService.ts';
import { ChatViewModel } from '../../../Models/ChatViewModel.ts';
import { ChatActionType } from '../../../Context/Chat/ChatReducer.ts';

interface MessageListProps {
    chat: ChatViewModel;
}

const SCROLL_TOP_THRESHOLD = 50;

const MessageList: React.FC<MessageListProps> = ({ chat }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const { chatDispatch } = useChatContext();
    const { loadMessages } = useMessageService();
    const prependRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (prependRef.current) {
            const prevHeight = prevScrollHeightRef.current;
            const prevTop = prevScrollTopRef.current;
            const newHeight = container.scrollHeight;
            const diff = newHeight - prevHeight;
            container.scrollTop = prevTop + diff;
            prependRef.current = false;
        } else {
            container.scrollTop = container.scrollHeight;
        }
    }, [chat.messages.length]);

    useEffect(() => {
        handleScroll();
        const ref = containerRef.current;
        ref?.addEventListener('scroll', handleScroll);
        return () => {
            ref?.removeEventListener('scroll', handleScroll);
        };
    }, [loadMessages, chat.messages.length, chat.id]);

    const handleScroll = async () => {
        const container = containerRef.current;
        if (!container) return;

        if (container.scrollTop < SCROLL_TOP_THRESHOLD) {
            prevScrollHeightRef.current = container.scrollHeight;
            prevScrollTopRef.current = container.scrollTop;
            prependRef.current = true;

            const messages = await loadMessages(chat.id, chat.messages.length, 10);
            if (messages.length === 0) {
                prependRef.current = false;
                return;
            }

            chatDispatch({
                type: ChatActionType.PrependMessages,
                payload: { chatId: chat.id, messages: messages },
            });
        }
    };

    function shouldShowStatus(messages: MessageViewModel[], index: number): boolean {
        if (!user?.IsUserConnectionId(messages[index].senderId)) {
            return false;
        }

        for (let i = index + 1; i < messages.length; i++) {
            if (user.IsUserConnectionId(messages[i].senderId)) {
                return messages[i].deliveryStatus !== messages[index].deliveryStatus;
            }
        }

        return true;
    }

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 pb-8">
            {chat.messages.map((message, index) => {
                const showStatus = shouldShowStatus(chat.messages, index);
                return <MessageBubble key={message.id} message={message} showStatus={showStatus} />;
            })}
        </div>
    );
};

export default MessageList;
