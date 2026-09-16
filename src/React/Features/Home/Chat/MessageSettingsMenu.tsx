import React from 'react';
import { MessageViewModel } from '../../../Models/MessageViewModel';
import { useMessageService } from '../../../Common/Hooks/MessageService';

const menuButtonClass = 'w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-darkGray-300 rounded-md';

export interface MessageSettingsProps {
    message: MessageViewModel;
    isOpen: boolean;
    isMine: boolean;
    isFailed: boolean;
    onClose: () => void;
}

export const MessageSettingsMenu: React.FC<MessageSettingsProps> = ({ message, isOpen, isMine, isFailed, onClose }) => {
    const { resendMessage } = useMessageService();
    if (!isOpen) return null;

    const Backdrop = () => (
        <div
            className="fixed inset-0 z-[900] bg-transparent"
            onClick={onClose}
            onContextMenu={(e) => {
                e.preventDefault();
                onClose();
            }}
            aria-hidden="true"
        />
    );

    return (
        <>
            <Backdrop />
            <div
                className={`
                    absolute top-full mt-2 z-[1100]
                    w-56 rounded-xl bg-darkGray-200 shadow-lg ring-1 ring-black/20 p-2
                    ${isMine ? 'right-0' : 'left-0'}
                `}
            >
                <button
                    className={menuButtonClass}
                    onClick={() => {
                        console.log('Mute', message.id);
                        onClose();
                    }}
                >
                    Edit
                </button>

                <div className="my-1 h-px bg-white/10" />

                <button className={`${menuButtonClass} text-red-300 hover:text-red-200 hover:bg-red-500/20`}>
                    Delete message
                </button>

                {isFailed === true && (
                    <button className={menuButtonClass} onClick={() => resendMessage(message)}>
                        Resend message
                    </button>
                )}
            </div>
        </>
    );
};

export default MessageSettingsMenu;
