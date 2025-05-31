import React, {useLayoutEffect, useRef} from "react";
import { MessageViewModel } from "../../../Models/MessageViewModel.ts";
import MessageBubble from "./MessageBubble.tsx";

interface MessageListProps {
    messages: MessageViewModel[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages.length]);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 pb-8"
        >
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
            ))}
        </div>
    );
};

export default MessageList;
