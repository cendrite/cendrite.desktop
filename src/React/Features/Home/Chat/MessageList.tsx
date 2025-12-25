import React, { useLayoutEffect, useRef } from 'react';
import { MessageViewModel } from '../../../Models/MessageViewModel.ts';
import MessageBubble from './MessageBubble.tsx';
import { useUser } from '../../../Context/User/UserContext.tsx';

interface MessageListProps {
    messages: MessageViewModel[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    useLayoutEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages.length]);

    function shouldShowStatus(messages: MessageViewModel[], index: number): boolean {
        if (!user?.IsUserConnectionId(messages[index].senderId)) {
            return false;
        }

        for (let i = index + 1; i < messages.length; i++) {
            if (user?.IsUserConnectionId(messages[i].senderId)) {
                return messages[i].deliveryStatus !== messages[index].deliveryStatus;
            }
        }

        return true;
    }

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 pb-8">
            {messages.map((message, index) => {
                const showStatus = shouldShowStatus(messages, index);
                return <MessageBubble key={message.id} message={message} showStatus={showStatus} />;
            })}
        </div>
    );
};

export default MessageList;
