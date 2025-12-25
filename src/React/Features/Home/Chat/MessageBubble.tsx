import { DeliveryStatus } from '../../../../Electron/Domain/Enums/DeliveryStatus.ts';
import { useUser } from '../../../Context/User/UserContext.tsx';
import { MessageViewModel } from '../../../Models/MessageViewModel.ts';
import {
    IconCircleDashed,
    IconCircleChevronRight,
    IconCircleChevronsRight,
    IconCircleChevronsRightFilled,
    IconCircleX,
} from '@tabler/icons-react';
import React, { type ReactNode, useState } from 'react';
import MessageSettingsMenu from './MessageSettingsMenu.tsx';

export interface ChatBubbleProps {
    message: MessageViewModel;
    showStatus: boolean;
}

function statusIcon(status: DeliveryStatus): ReactNode {
    switch (status) {
        case DeliveryStatus.Pending:
            return <IconCircleDashed className="w-3.5 h-3.5 text-gray-300" />;
        case DeliveryStatus.Sent:
            return <IconCircleChevronRight className="w-3.5 h-3.5 text-gray-400" />;
        case DeliveryStatus.Delivered:
            return <IconCircleChevronsRight className="w-3.5 h-3.5 text-gray-300" />;
        case DeliveryStatus.Read:
            return <IconCircleChevronsRightFilled className="w-3.5 h-3.5 text-gray-200" />;
        case DeliveryStatus.Failed:
            return <IconCircleX className="w-3.5 h-3.5 text-red-500" />;
        case DeliveryStatus.Received:
            return null;
        default:
            const _exhaustiveCheck: never = status;
            return _exhaustiveCheck;
    }
}

export const MessageBubble: React.FC<ChatBubbleProps> = ({ message, showStatus }) => {
    const { user } = useUser();
    const isMine = user?.IsUserConnectionId(message.senderId) ?? false;
    const icon = isMine && showStatus ? statusIcon(message.deliveryStatus) : null;
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className="relative max-w-[75%] sm:max-w-[60%] md:max-w-[50%]">
                    <div
                        onContextMenu={(e) => {
                            if (!isMine) return;
                            e.preventDefault();
                            setMenuOpen(true);
                        }}
                        className={`
                            break-words whitespace-pre-wrap px-4 py-2 rounded-2xl text-sm
                            ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}
                        `}
                    >
                        {message.text}
                    </div>

                    <MessageSettingsMenu
                        message={message}
                        isOpen={menuOpen}
                        isMine={isMine}
                        onClose={() => setMenuOpen(false)}
                    />
                </div>
            </div>

            {icon && <div className="flex justify-end mb-1.5 mr-1.5">{icon}</div>}
        </>
    );
};

export default MessageBubble;
