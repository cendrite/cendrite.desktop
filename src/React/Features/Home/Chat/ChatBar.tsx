import {FaceSmileIcon, MicrophoneIcon, PaperClipIcon} from "@heroicons/react/24/outline";
import React, {useState} from "react";
import TextareaAutosize from "react-textarea-autosize";


export const ChatBar: React.FC = () => {
    const [message, setMessage] = useState("");
    const [placeholderText, setPlaceholderText] = useState("message");

    const handleSendMessage = () => {
        if (message.trim() === "") return;
        console.log("Message sent");
    }

    return (
        <div className="bg-zinc-950 p-3">
            <div className="flex items-center space-x-2">
                <button className="p-2 rounded-md hover:bg-darkGray-300">
                    <FaceSmileIcon className="h-5 w-5 text-gray-200"/>
                </button>

                <TextareaAutosize
                    className="flex-1 bg-darkGray-700 text-white p-2 rounded-3xl resize-none focus:outline-none px-3"
                    minRows={1}
                    maxRows={5}
                    placeholder={placeholderText}
                    onFocus={() => setPlaceholderText("")}
                    onBlur={() => setPlaceholderText("message")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />

                <button className="p-2 rounded-md hover:bg-darkGray-300">
                    <PaperClipIcon className="h-5 w-5 text-gray-200"/>
                </button>

                <button className="p-2 rounded-md hover:bg-darkGray-300">
                    <MicrophoneIcon className="h-5 w-5 text-gray-200"/>
                </button>

            </div>
        </div>
    );
};

export default ChatBar;
