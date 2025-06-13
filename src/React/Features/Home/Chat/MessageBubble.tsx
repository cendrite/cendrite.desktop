import { MessageViewModel } from "../../../Models/MessageViewModel.ts";
import React from "react";
import { useUser } from "../../../Context/UserContext.tsx";

export interface ChatBubbleProps {
    message: MessageViewModel;
}

export const MessageBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const { user } = useUser();
    const isUserMessage: boolean = message.senderId === user?.deviceId;

    return (
        <div className={`flex ${isUserMessage ? "justify-end" : "justify-start"} mb-2`}>
            <div
                className={`
                    break-words 
                    whitespace-pre-wrap 
                    px-4 py-2 
                    rounded-2xl 
                    text-sm 
                    ${isUserMessage ? "bg-blue-500 text-white" : "bg-gray-200 text-black"} 
                    max-w-[75%] sm:max-w-[60%] md:max-w-[50%]
                `}
            >
                {message.text}
            </div>
        </div>
    );
};

export default MessageBubble;
