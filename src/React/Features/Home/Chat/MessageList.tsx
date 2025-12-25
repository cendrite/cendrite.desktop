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

    const isMine = (message: MessageViewModel): boolean =>
        message.senderId === user!.connectionId || user!.externalConnectionIds.includes(message.senderId);

    useLayoutEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages.length]);

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 pb-8">
            {messages.map((message, index) => {
                const mine = isMine(message);

                let showStatus = false;

                if (mine) {
                    const isLast = index === messages.length - 1;

                    if (isLast) {
                        showStatus = true;
                    } else {
                        const next = messages[index + 1];
                        const nextIsMine = isMine(next);
                        if (!nextIsMine || next.deliveryStatus !== message.deliveryStatus) {
                            showStatus = true;
                        }
                    }
                }

                return <MessageBubble key={message.id} message={message} showStatus={showStatus} />;
            })}
        </div>
    );
};

export default MessageList;
