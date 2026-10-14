import { DeliveryStatus } from '@/Shared/Enums/DeliveryStatus.ts';
import { useUser } from '@/React/Context/User/UserContext.tsx';
import { MessageViewModel } from '@/React/Models/MessageViewModel.ts';
import {
    IconCircleDashed,
    IconCircleChevronRight,
    IconCircleChevronsRight,
    IconCircleChevronsRightFilled,
    IconCircleX,
} from '@tabler/icons-react';
import React, { type ReactNode, useState } from 'react';
import MessageSettingsMenu from './MessageSettingsMenu.tsx';
import { MediaBox } from './MediaBox.tsx';

export interface ChatBubbleProps {
    message: MessageViewModel;
    showStatus: boolean;
    senderName?: string;
}

function determineStatusIcon(status: DeliveryStatus): ReactNode {
    switch (status) {
        case DeliveryStatus.Pending:
            return <IconCircleDashed className="w-3.5 h-3.5 text-fg-muted" />;
        case DeliveryStatus.Sent:
            return <IconCircleChevronRight className="w-3.5 h-3.5 text-fg-subtle" />;
        case DeliveryStatus.Delivered:
            return <IconCircleChevronsRight className="w-3.5 h-3.5 text-fg-muted" />;
        case DeliveryStatus.Read:
            return <IconCircleChevronsRightFilled className="w-3.5 h-3.5 text-fg-muted" />;
        case DeliveryStatus.Failed:
            return <IconCircleX className="w-3.5 h-3.5 text-danger-fg" />;
        case DeliveryStatus.Received:
            return null;
        default: {
            const _exhaustiveCheck: never = status;
            return _exhaustiveCheck;
        }
    }
}

export const MessageBubble: React.FC<ChatBubbleProps> = ({ message, showStatus, senderName }) => {
    const { user } = useUser();
    const isMine = user?.IsUserConnectionId(message.senderId) ?? false;

    const [menuOpen, setMenuOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const handleToggleInfo = () => setShowInfo((prev) => !prev);

    const statusIcon = isMine && showStatus ? determineStatusIcon(message.deliveryStatus) : null;

    const formattedDate = message.date.toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${senderName ? 'mt-3' : 'mt-1'} mb-1`}>
                <div className="relative max-w-[75%] sm:max-w-[60%] md:max-w-[50%]">
                    {senderName && <p className="mb-0.5 ml-3 text-xs text-fg-subtle">{senderName}</p>}
                    <div
                        onContextMenu={(e) => {
                            if (!isMine) return;
                            e.preventDefault();
                            setMenuOpen(true);
                        }}
                        onClick={handleToggleInfo}
                        className={`
                            break-words whitespace-pre-wrap px-4 py-2 rounded-2xl text-sm cursor-pointer
                            ${isMine ? 'bg-accent text-fg-on-accent' : 'bg-bubble-in text-bubble-in-fg'}
                        `}
                    >
                        <MediaBox media={message.media} />
                        {message.text}
                    </div>

                    <MessageSettingsMenu
                        message={message}
                        isOpen={menuOpen}
                        isMine={isMine}
                        isFailed={message.deliveryStatus === DeliveryStatus.Failed}
                        onClose={() => setMenuOpen(false)}
                    />
                </div>
            </div>
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                {(showInfo || statusIcon) && (
                    <div
                        className={`mt-1 text-xs flex items-center gap-2 
                            ${isMine ? 'mr-2 justify-end text-fg-subtle' : 'ml-3 text-fg-faint'}`}
                    >
                        {showInfo && <span>{formattedDate}</span>}
                        {determineStatusIcon(message.deliveryStatus)}
                    </div>
                )}
            </div>
        </>
    );
};

export default MessageBubble;
